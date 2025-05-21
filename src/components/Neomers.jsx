// Neomers.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as Constants from "../constants";
import { FaBars, FaTimes } from "react-icons/fa";
import SelectWithSearch from "./shared/SelectWithSearch";
import "./styles.css"
// Options for the main table
const lengthOptions = [11, 12, 13, 14, 15, 16];
const pageSizeOptions = [10, 20, 50, 100, 1000];

// Default columns to show on first load
const defaultVisibleColumnsOrder = [
  "nullomers_created",
  "Cancer_Type",
  "Organ",
  "Hugo_Symbol",
  "Variant_Classification",
  "AF"
];

// Filter types for text-like columns
const textFilterTypes = [
  { value: "equals", label: "Equals" },
  { value: "notEquals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "notContains", label: "Not Contains" },
  { value: "starts", label: "Starts With" },
  { value: "notStarts", label: "Not Starts With" },
  { value: "ends", label: "Ends With" },
  { value: "notEnds", label: "Not Ends With" }
];

// Special filters
const specialFilterTypes = [
  { value: "at_least_X_distinct_patients", label: "At Least X Distinct Donors" }
];

// Numeric filter types (for GC content)
const numericFilterTypes = [
  { value: "gc_between", label: "GC Between (%)" }
];
// Numeric filter types (for the rest numeric cases)
const numericFilterTypesGeneric = [
  { value: "equals", label: "Equals" },
  { value: "notEquals", label: "Not Equals" },
  { value: "greaterThan", label: "Greater than" },
  { value: "lessThan", label: "Less than" }];


// Numeric AF Filters    
const validAFValues = ["AF", "AF_eas", "AF_afr", "AF_fin", "AF_ami", "AF_amr", "AF_nfe", "AF_sas", "AF_asj"];
const numericFilterTypeGreaterLess = [
  { value: "greaterThan", label: "Greater than" },
  { value: "lessThan", label: "Less than" }];


// Mapping from backend column keys to display labels
const columnLabelMapping = {
  nullomers_created: "Neomers",
  // etc...
};

const Neomers = () => {
  // ------------------ Main table states ------------------
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  // ----------------- Controls dropdown visibility -----------------
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermFilter, setSearchTermFilter] = useState("");
  const [dropdownStates, setDropdownStates] = useState([]); // Array to track dropdown states for each filter

  // ------------------ Filters & Suggestions ------------------
  const [additionalFilters, setAdditionalFilters] = useState([]);
  const [typedValues, setTypedValues] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionOpenIndex, setSuggestionOpenIndex] = useState(null);
  const suggestionCancelToken = useRef(null);

  // Selected length
  const [selectedLength, setSelectedLength] = useState(11);

  // ------------------ Stats table states ------------------
  const [statsData, setStatsData] = useState([]);
  const [statsColumns, setStatsColumns] = useState([]);
  const [groupByColumns, setGroupByColumns] = useState([]);
  const [topN, setTopN] = useState(10);

  // ------------------ Configuration Panel Toggle ------------------
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);

  // ------------------ Effects ------------------
  // Handle Mutliple Filter Dropdowns
  const toggleDropdown = (index) => {
    setDropdownStates((prev) => {
      const newState = [...prev];
      newState[index] = !newState[index]; // Toggle the state of the specific dropdown
      return newState;
    });
  };


  // Close suggestions if clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionOpenIndex !== null) {
        if (!e.target.closest(".suggestions-dropdown")) {
          setSuggestions([]);
          setSuggestionOpenIndex(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [suggestionOpenIndex]);

  /**
   * Check if any filter is incomplete before calling the API.
   */
  const hasIncompleteFilter = () => {
    return additionalFilters.some((af) => {
      // If filter has no column selected (and it's a type that needs a column) => incomplete
      if (af.type !== "at_least_X_distinct_patients" && af.type !== "gc_between") {
        if (!af.columnKey) return true;
        if (!af.value || !af.value.trim()) return true;
      }
      if (af.type === "at_least_X_distinct_patients") {
        // need a numeric value
        if (!af.value || !af.value.trim()) return true;
      }
      // GC_BETWEEN: must have 2 values
      if (af.type === "gc_between") {
        const parts = af.value.split(",");
        if (parts.length < 2) return true;
        const [minVal, maxVal] = parts;
        if (!minVal?.trim() || !maxVal?.trim()) return true;
      }
      return false;
    });
  };

  // Fetch main table data whenever length, page, pageSize, or filters change
  useEffect(() => {
    if (hasIncompleteFilter()) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLength, currentPage, pageSize, additionalFilters]);

  // Fetch stats data whenever length, filters, groupBy, or topN change
  useEffect(() => {
    if (hasIncompleteFilter()) return;
    fetchStatsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLength, additionalFilters, groupByColumns, topN]);

  // ------------------ Building Filter Queries ------------------
  const buildFiltersQuery = () => {

    if (additionalFilters.length === 0) return "";

    let conditions = "";
    additionalFilters.forEach((af, index) => {
      // If it's a special filter, skip here
      if (af.type === "at_least_X_distinct_patients") {
        return;
      }
      // Condition check for bugfix
      if (af.columnKey === "gc_content" && af.type === 'notEquals') {
        af.type = 'gc_between'
      }

      let condition = "";
      // GC_BETWEEN FIX:
      if (af.type === "gc_between") {
        const parts = af.value.split(",");
        // Expect two inputs: X,Y
        if (parts.length !== 2) {
          // If user hasn't typed 2 values, make condition always false or skip
          condition = "1=0";
        } else {
          // Round to 2 decimals
          const minVal = Number(parseFloat(parts[0]).toFixed(2));
          const maxVal = Number(parseFloat(parts[1]).toFixed(2));
          // Implement X < gc_content < Y (EXCLUSIVE).
          // If you prefer inclusive, use >= and <=
          condition = `(gc_content > ${minVal} AND gc_content < ${maxVal})`;
        }
      } 
      else if (validAFValues.includes(af.columnKey) && af.type === "between" && af.value) {
                const [rawMin, rawMax] = af.value.split(",");
                const min = parseFloat(rawMin).toFixed(2);
                const max = parseFloat(rawMax).toFixed(2);
                condition = `("${af.columnKey}" >= ${min} AND "${af.columnKey}" <= ${max})`;
      }
      else {
        // Text filters (equals, notEquals, contains, etc.)
        // Detect if the value is numeric
        const col = `"${af.columnKey}"`; // Always quote the column name
        const isNumericValue = !isNaN(af.value) && af.value.trim() !== "";
        const val = isNumericValue ? af.value : af.value.replace(/'/g, "''").trim();

        switch (af.type) {
          case "equals":
            condition = `(${col} = '${val}')`;
            break;
          case "notEquals":
            condition = `(${col} <> '${val}')`;
            break;
          case "starts":
            condition = `(${col} LIKE '${val}%')`;
            break;
          case "notStarts":
            condition = `(${col} NOT LIKE '${val}%')`;
            break;
          case "greaterThan":
            condition = `(${col} > ${val})`;
            break;
          case "lessThan":
            condition = `(${col} < ${val})`;
            break;
          case "ends":
            condition = `(${col} LIKE '%${val}')`;
            break;
          case "notEnds":
            condition = `(${col} NOT LIKE '%${val}')`;
            break;
          case "contains":
            condition = `(${col} LIKE '%${val}%')`;
            break;
          case "notContains":
            condition = `(${col} NOT LIKE '%${val}%')`;
            break;
          default:
            condition = "1=1";
        }
      }

      if (condition) {
        const logicOp = af.logicOp || "AND";
        if (index === 0) {
          conditions += condition;
        } else {
          conditions += ` ${logicOp} ${condition}`;
        }
      }
    });

    return conditions;
  };

  const buildSpecialFiltersString = () => {
    const specialParts = [];
    additionalFilters.forEach((af) => {
      if (af.type === "at_least_X_distinct_patients") {
        if (af.value) {
          specialParts.push(`at_least_X_distinct_patients;${af.value}`);
        }
      }
    });
    return specialParts.join("|");
  };

  // ------------------ Data Fetching (Main Table) ------------------
  const fetchData = async () => {
    try {
      setLoading(true);

      const filtersStr = buildFiltersQuery();
      const specialFiltersStr = buildSpecialFiltersString();

      let limit = typeof pageSize === "number" ? pageSize : 1000;
      const params = {
        length: selectedLength,
        page: currentPage,
        limit
      };
      if (filtersStr) {
        params.filters = filtersStr;
      }
      if (specialFiltersStr) {
        params.specialFilters = specialFiltersStr;
      }
      console.log("API CALL", params)
      const endpoint = `${Constants.API_URL}/get_nullomers`;
      const response = await axios.get(endpoint, { params });

      // Clear any old error on success
      setError(null);

      const fetchedHeaders = response.data.headers;
      const fetchedData = response.data.data;
      const totalCount = response.data.totalCount;

      // Convert array-of-arrays to array-of-objects
      const rowObjects = fetchedData.map((rowArray) => {
        const rowObj = {};
        fetchedHeaders.forEach((col, i) => {
          rowObj[col] = rowArray[i];
        });
        return rowObj;
      });

      setColumns(
        fetchedHeaders.map((h) => ({
          key: h,
          label: columnLabelMapping[h] || h
        }))
      );

      setData(rowObjects);
      setTotalCount(totalCount);

      const calculatedTotalPages = Math.ceil(
        totalCount / (typeof pageSize === "number" ? pageSize : 1000)
      );
      setTotalPages(calculatedTotalPages);

      if (visibleColumns.length === 0 && fetchedHeaders.length > 0) {
        const finalCols = defaultVisibleColumnsOrder.filter((h) =>
          fetchedHeaders.includes(h)
        );
        setVisibleColumns(finalCols);
      }

      setSelectedRows([]);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data.");
      setLoading(false);
    }
  };

  // ------------------ Data Fetching (Stats Table) ------------------
  const fetchStatsData = async () => {
    try {
      setLoading(true);

      const filtersStr = buildFiltersQuery();
      const specialFiltersStr = buildSpecialFiltersString();

      const groupBy = groupByColumns
        .map((col) => `"${col}"`) // Wrap each column name in double quotes
        .join(",");

      const params = {
        length: selectedLength,
        filters: filtersStr,
        groupBy,
        topN
      };
      if (specialFiltersStr) {
        params.specialFilters = specialFiltersStr;
      }

      const endpoint = `${Constants.API_URL}/get_nullomers_stats`;
      const response = await axios.get(endpoint, { params });

      setError(null); // clear error on success

      const fetchedHeaders = response.data.headers;
      const fetchedData = response.data.data;

      const rowObjects = fetchedData.map((rowArray) => {
        const rowObj = {};
        fetchedHeaders.forEach((col, i) => {
          rowObj[col] = rowArray[i];
        });
        return rowObj;
      });

      setStatsColumns(
        fetchedHeaders.map((h) => ({
          key: h,
          label: columnLabelMapping[h] || h
        }))
      );
      setStatsData(rowObjects);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching stats data:", err);
      setError("Failed to fetch stats data.");
      setLoading(false);
    }
  };

  // ------------------ Filter Management ------------------
  const addFilter = () => {
    setAdditionalFilters((prev) => [
      ...prev,
      { columnKey: "", type: "notEquals", value: "", logicOp: "AND" }
    ]);
  };

  // Update the updateAdditionalFilter function to reset dependent fields
// Inside your Neomers component:

const updateAdditionalFilter = (index, key, val) => {
  setAdditionalFilters((prev) => {
    const newFilters = [...prev];
    const currentFilter = newFilters[index];

    if (key === "columnKey") {
      // If they pick an AF* column, force type="between" and full range
      if (validAFValues.includes(val)) {
        newFilters[index] = {
          ...currentFilter,
          columnKey: val,
          type: "between",
          value: "0.00,1.00",
        };
      } else {
        // Otherwise reset type and value
        newFilters[index] = {
          ...currentFilter,
          columnKey: val,
          type: "",
          value: "",
        };
      }
    } else if (key === "type") {
      // Changing filter type always resets the value
      newFilters[index] = {
        ...currentFilter,
        type: val,
        value: "",
      };
    } else {
      // For all other keys (e.g. value or logicOp)
      newFilters[index] = {
        ...currentFilter,
        [key]: val,
      };
    }

    return newFilters;
  });
};



  const removeAdditionalFilter = (index) => {
    setAdditionalFilters((prev) => prev.filter((_, i) => i !== index));
  };

  // ------------------ Suggestions (autocomplete) ------------------
  const handleFilterValueChange = async (index, newValue) => {
    const af = additionalFilters[index];

    if (!af) return;

    setTypedValues((prev) => ({ ...prev, [index]: newValue }));

    if (af.type === "gc_between" || !af.columnKey || !af.type) {
      setSuggestions([]);
      setSuggestionOpenIndex(null);
      return;
    }
    if (af.type === "at_least_X_distinct_patients") {
      setSuggestions([]);
      setSuggestionOpenIndex(null);
      return;
    }

    if (suggestionCancelToken.current) {
      suggestionCancelToken.current.cancel("cancelled");
    }
    const CancelToken = axios.CancelToken;
    suggestionCancelToken.current = CancelToken.source();

    let baseType = af.type;
    if (baseType.startsWith("not")) {
      if (baseType === "notEquals") baseType = "equals";
      else if (baseType === "notContains") baseType = "contains";
      else if (baseType === "notStarts") baseType = "starts";
      else if (baseType === "notEnds") baseType = "ends";
    }

    try {
      const params = {
        column: af.columnKey,
        input: newValue,
        filterType: baseType,
        length: selectedLength
      };
      const resp = await axios.get(`${Constants.API_URL}/get_suggestions`, {
        params,
        cancelToken: suggestionCancelToken.current.token
      });
      setSuggestions(resp.data.suggestions);
      setSuggestionOpenIndex(index);
    } catch (err) {
      if (axios.isCancel(err)) {
        // request cancelled
      } else {
        console.error(err);
        setSuggestions([]);
        setSuggestionOpenIndex(null);
      }
    }
  };

  const handleSuggestionClick = (index, suggestion) => {
    setSuggestions([]);
    setSuggestionOpenIndex(null);
    setTypedValues((prev) => ({ ...prev, [index]: suggestion }));
    applyValueToFilter(index, suggestion);
  };

  const applyValueToFilter = (index, value) => {
    const af = additionalFilters[index];
    if (!af) return;
    updateAdditionalFilter(index, "value", value);
  };


  // ------------------ Pagination & Page Size ------------------
  const handlePageSizeChange = (e) => {
    const val = e.target.value;
    setPageSize(Number(val));
    setCurrentPage(0);
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1 || totalPages === 0) {
      setCurrentPage(currentPage + 1);
    }
  };

  // ------------------ Remove All Filters ------------------
  const removeAllFiltersHandler = () => {
    setAdditionalFilters([]);
    setCurrentPage(0);
  };

  // ------------------ Visible Columns Checkboxes ------------------
  const toggleColumn = (columnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const toggleAllColumns = (checked) => {
    setVisibleColumns(checked ? columns.map((col) => col.key) : []);
  };

  // ------------------ Row Selection & Export CSV ------------------
  const toggleRowSelection = (index) => {
    setSelectedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleSelectAllRows = () => {
    if (selectedRows.length === data.length && data.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map((_, i) => i));
    }
  };

  const handleExportCSV = () => {
    const rowsToExport = selectedRows.map((index) => data[index]);
    if (rowsToExport.length === 0) {
      alert("No rows selected for export.");
      return;
    }

    const csvHeaders = visibleColumns
      .map((colKey) => {
        const column = columns.find((col) => col.key === colKey);
        return `"${column ? column.label : colKey}"`;
      })
      .join(",");

    const csvRows = rowsToExport.map((row) => {
      return visibleColumns
        .map((colKey) => {
          const cell = row[colKey];
          if (cell === null || cell === undefined) return '""';
          const cellStr = String(cell).replace(/"/g, '""');
          return `"${cellStr}"`;
        })
        .join(",");
    });

    const csvContent = [csvHeaders, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "nullomers_visible_rows.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ------------------ Stats Table "group by" logic ------------------
  const handleAddGroupBy = (colKey) => {
    if (!groupByColumns.includes(colKey)) {
      setGroupByColumns([...groupByColumns, colKey]);
    }
  };

  const handleRemoveGroupBy = (colKey) => {
    setGroupByColumns((prev) => prev.filter((c) => c !== colKey));
  };


    // AF‐ranges: update the min or max thumb
  const handleAFSliderChange = (index, which, rawVal) => {
    // rawVal is a string; ensure it’s formatted as “0.00”–“1.00”
    const val = parseFloat(rawVal).toFixed(2)
    const parts = additionalFilters[index].value.split(",")
    const min = which === "min" ? val : parts[0] || "0.00"
    const max = which === "max" ? val : parts[1] || "1.00"
    // make sure min ≤ max
    if (parseFloat(min) > parseFloat(max)) return
    updateAdditionalFilter(index, "value", `${min},${max}`);
  }

  // ------------------ Render ------------------
  return (
    <div className="relative p-4 space-y-4">
      <h2 className="text-2xl font-bold">Neomers Table</h2>
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center absolute inset-0 bg-white bg-opacity-50">
          <svg
            className="animate-spin h-8 w-8 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
        </div>
      )}

      {/*Humburger Menu*/}
      <div className="fixed top-4 right-4 z-50 m-4">
        <button
          className="flex items-center gap-2 bg-white text-gray-700 font-medium shadow-lg px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 hover:shadow-xl transition-all duration-200"
          onClick={() => setShowConfigPanel(!showConfigPanel)}
        >
          <span>Neomer Configuration</span>
          <span
            className={`text-xl transition-transform transform ${showConfigPanel ? "rotate-180" : ""
              }`}
          >
            &#9662; {/* Down Arrow using Unicode */}
          </span>
        </button>
      </div >

      {/* Side Configuration Panel */}


<>
  
  {/* Backdrop */}
  {showConfigPanel && (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40"
      onClick={() => setShowConfigPanel(false)}
    />
  )}

  {/* Drawer */}
  <aside
    className={`
      fixed top-0 right-0 h-full w-[50rem] bg-white z-50
      transform ${showConfigPanel ? 'translate-x-0' : 'translate-x-full'}
      transition-transform duration-300 ease-in-out
      shadow-2xl overflow-y-auto
    `}
  >
    {/* Header */}
    <div className="p-6 flex items-center justify-between border-b">
      <h3 className="text-xl font-semibold">Neomer Configuration</h3>
      <button
        className="text-gray-500 hover:text-gray-700 focus:outline-none"
        onClick={() => setShowConfigPanel(false)}
      >
        <FaTimes size={20} />
      </button>
    </div>

    <div className="p-6 space-y-6">
      {/* Neomer Length */}
      <div>
        <label className="block text-sm font-medium mb-1">Neomer Length</label>
        <select
          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={selectedLength}
          onChange={e => {
            setSelectedLength(+e.target.value);
            setAdditionalFilters([]);
            setCurrentPage(0);
          }}
        >
          {lengthOptions.map(len => (
            <option key={len} value={len}>{len}</option>
          ))}
        </select>
      </div>

      {/* Visible Columns */}
      <div>
        <button
          className="w-full flex justify-between items-center bg-gradient-to-r from-blue-400 to-blue-500 text-white px-4 py-2 rounded-md hover:from-blue-500 hover:to-blue-600 focus:outline-none"
          onClick={() => setShowColumnsDropdown(!showColumnsDropdown)}
        >
          <span>Visible Columns</span>
          <svg
            className={`w-5 h-5 transform transition-transform ${showColumnsDropdown ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showColumnsDropdown && (
          <div className="mt-2 border rounded-md bg-gray-50 shadow p-4 max-h-64 overflow-auto">
            <input
              type="text"
              placeholder="Search columns…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full mb-3 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <div className="flex items-center mb-3">
              <input
                id="toggle-all" type="checkbox"
                checked={visibleColumns.length === columns.length && columns.length > 0}
                onChange={e => toggleAllColumns(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="toggle-all" className="text-sm">Show All</label>
            </div>
            {columns
              .filter(col => col.label.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(col => (
                <div key={col.key} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`col-${col.key}`}
                    checked={visibleColumns.includes(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`col-${col.key}`} className="text-sm">{col.label}</label>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Filters</h4>
          <button
            className="text-blue-600 hover:underline text-sm focus:outline-none"
            onClick={addFilter}
          >
            + Add Filter
          </button>
        </div>
        {additionalFilters.length > 0 && (
          <div className="space-y-4">
            {additionalFilters.map((af, i) => {
              const filterTypes = af.columnKey === "gc_content"
                ? numericFilterTypes.concat(specialFilterTypes)
                : validAFValues.includes(af.columnKey)
                ? numericFilterTypeGreaterLess
                : af.columnKey === "donor_age_at_diagnosis" ||
                  af.columnKey === "donor_survival_time" ||
                  af.columnKey === "donor_interval_of_last_followup"
                ? numericFilterTypesGeneric.concat(specialFilterTypes)
                : textFilterTypes.concat(specialFilterTypes);

              const currentTypedValue = typedValues[i] ?? af.value;

              return (
                <div key={i} className="grid grid-cols-3 gap-3 items-end">
                  {/* Column */}
                  <div>
                    <label className="text-xs text-gray-600">Column</label>
                    <select
                      className="w-full border rounded px-2 py-1 focus:ring-blue-300"
                      value={af.columnKey}
                      onChange={e => updateAdditionalFilter(i, "columnKey", e.target.value)}
                    >
                      <option value="">Select…</option>
                      {columns.map(col => (
                        <option key={col.key} value={col.key}>{col.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="text-xs text-gray-600">Type</label>
                    {validAFValues.includes(af.columnKey) ? (
                      <select disabled className="w-full border rounded px-2 py-1 bg-gray-100 text-gray-500">
                        <option value="between">Between</option>
                      </select>
                    ) : (
                      <select
                        className="w-full border rounded px-2 py-1 focus:ring-blue-300"
                        value={af.type}
                        onChange={e => updateAdditionalFilter(i, "type", e.target.value)}
                      >
                        <option value="">Select…</option>
                        {filterTypes.map(ft => (
                          <option key={ft.value} value={ft.value}>{ft.label}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Value */}
                  <div>
                    <label className="text-xs text-gray-600">&nbsp;</label>
                    {af.type === "gc_between" ? (
                      <div className="flex space-x-2">
                        <input
                          type="number" placeholder="min"
                          className="w-1/2 border rounded px-2 py-1 focus:ring-blue-300"
                          value={af.value.split(",")[0] || ""}
                          onChange={e => {
                            const parts = af.value.split(",");
                            parts[0] = e.target.value;
                            updateAdditionalFilter(i, "value", parts.join(","));
                          }}
                        />
                        <input
                          type="number" placeholder="max"
                          className="w-1/2 border rounded px-2 py-1 focus:ring-blue-300"
                          value={af.value.split(",")[1] || ""}
                          onChange={e => {
                            const parts = af.value.split(",");
                            parts[1] = e.target.value;
                            updateAdditionalFilter(i, "value", parts.join(","));
                          }}
                        />
                      </div>
                    ) : af.type === "at_least_X_distinct_patients" ? (
                      <input
                        type="number" placeholder="Count ≥"
                        className="w-full border rounded px-2 py-1 focus:ring-blue-300"
                        value={currentTypedValue}
                        onChange={e => handleFilterValueChange(i, e.target.value)}
                        onBlur={() => updateAdditionalFilter(i, "value", currentTypedValue)}
                      />
                    ) : validAFValues.includes(af.columnKey) ? (
                      /* AF range sliders */
                      <div className="space-y-2">
                      {(() => {
                        const [minVal = "0.00", maxVal = "1.00"] = af.value.split(",");
                        return (
                          <div className="flex justify-between text-xs text-gray-700 mb-1">
                            <span>Min: {parseFloat(minVal).toFixed(2)}</span>
                            <span>Max: {parseFloat(maxVal).toFixed(2)}</span>
                          </div>
                        );
                      })()}
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={af.value.split(",")[0] || "0.00"}
                        onChange={e => handleAFSliderChange(i, "min", e.target.value)}
                      />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={af.value.split(",")[1] || "1.00"}
                        onChange={e => handleAFSliderChange(i, "max", e.target.value)}
                      />
                    </div>
                    ) : (
                      <div className="relative">
                        <input
                          type={["greaterThan","lessThan"].includes(af.type) ? "number" : "text"}
                          className="w-full border rounded px-2 py-1 focus:ring-blue-300"
                          placeholder="Enter value…"
                          value={currentTypedValue}
                          onChange={e => handleFilterValueChange(i, e.target.value)}
                          onBlur={() => applyValueToFilter(i, currentTypedValue)}
                        />
                        {suggestionOpenIndex === i && suggestions.length > 0 && (
                          <ul className="absolute top-full left-0 right-0 bg-white border rounded mt-1 max-h-32 overflow-auto z-10">
                            {suggestions.map(sug => (
                              <li
                                key={sug}
                                className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                                onMouseDown={() => handleSuggestionClick(i, sug)}
                              >
                                {sug}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    className="text-red-500 text-xs hover:underline"
                    onClick={() => removeAdditionalFilter(i)}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-3">
        <button
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md focus:outline-none"
          onClick={removeAllFiltersHandler}
        >
          Clear All Filters
        </button>
        <button
          className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md focus:outline-none"
          onClick={handleExportCSV}
        >
          Export Selected CSV
        </button>
      </div>

      {/* Statistics Configuration */}
      <div className="pt-4 border-t">
        <h4 className="text-base font-semibold mb-2">Stats Configuration</h4>
        <div className="flex items-center mb-4">
          <label className="mr-2">Top N:</label>
          <input
            type="number" min={1}
            className="w-20 border rounded px-2 py-1 focus:ring-blue-300"
            value={topN}
            onChange={e => setTopN(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block mb-1">Group By:</label>
          <SelectWithSearch columns={columns} handleAddGroupBy={handleAddGroupBy} />
          {groupByColumns.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {groupByColumns.map(colKey => {
                const col = columns.find(c => c.key === colKey);
                return (
                  <span
                    key={colKey}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center"
                  >
                    {col?.label || colKey}
                    <button
                      onClick={() => handleRemoveGroupBy(colKey)}
                      className="ml-1 text-red-600 focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  </aside>
</>





      {/* Main Table */}
      <div className="overflow-x-auto relative">
        <table className="min-w-full bg-white border border-gray-300 table-auto">
          <thead>
            <tr>
              <th className="p-3 border-b text-center whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedRows.length === data.length && data.length > 0}
                  onChange={toggleSelectAllRows}
                  className="mr-2"
                />
              </th>
              {visibleColumns.map((colKey) => {
                const column = columns.find((c) => c.key === colKey);
                return (
                  <th
                    key={colKey}
                    className="p-3 border-b text-center whitespace-nowrap"
                    style={{ verticalAlign: "middle" }}
                  >
                    <div className="font-semibold text-sm">
                      {column?.label || colKey}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={rowIndex % 2 === 0 ? "bg-gray-100" : ""}
              >
                <td className="p-3 border text-center whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(rowIndex)}
                    onChange={() => toggleRowSelection(rowIndex)}
                    className="mr-2"
                  />
                </td>
                {visibleColumns.map((colKey) => (
                  <td
                    key={colKey}
                    className="p-3 border text-center whitespace-nowrap"
                    style={{ verticalAlign: "middle" }}
                  >
                    {row[colKey] === null ? "Null" : String(row[colKey]) || "-"}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={visibleColumns.length + 1}
                  className="p-2 text-center text-gray-500"
                >
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 0}
            className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
          >
            Previous
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages - 1 || totalPages === 0}
            className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
          >
            Next
          </button>
        </div>
        <div className="text-sm">
          Page {currentPage + 1} of {totalPages || 1}, Total Rows: {totalCount}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="border px-2 py-1 rounded bg-white hover:bg-gray-50"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>per page</span>
        </div>
      </div>

      {/* Stats Table */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-2">Neomer Statistics Table</h3>
        <div className="overflow-x-auto relative">
          <table className="min-w-full bg-white border border-gray-300 table-auto">
            <thead>
              <tr>
                {statsColumns.map((col) => (
                  <th
                    key={col.key}
                    className="p-3 border-b text-center whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statsData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? "bg-gray-100" : ""}
                >
                  {statsColumns.map((col) => (
                    <td
                      key={col.key}
                      className="p-3 border text-center whitespace-nowrap"
                    >
                      {row[col.key] === null ? "Null" : String(row[col.key]) || "-"}
                    </td>
                  ))}
                </tr>
              ))}
              {statsData.length === 0 && (
                <tr>
                  <td
                    colSpan={statsColumns.length}
                    className="p-2 text-center text-gray-500"
                  >
                    No data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* If you want separate pagination for the stats table, add it here.
            For now, we just reuse the same "topN" logic. */}
        <div className="flex items-center gap-2 mt-4 text-sm">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="border px-2 py-1 rounded bg-white hover:bg-gray-50"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>per page</span>
        </div>
      </div>
    </div >
  );
};

export default Neomers;
