// Neomers.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as Constants from "../constants";
import { FaBars, FaTimes } from "react-icons/fa";
import SelectWithSearch from "./shared/SelectWithSearch";

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
    "gc_content"
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

const Exomes = () => {
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
        console.log("edwww addiitonalFilters", additionalFilters)
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
            } else {
                // Text filters (equals, notEquals, contains, etc.)
                // Detect if the value is numeric
                const col = `"${af.columnKey}"`; // Always quote the column name
                const isNumericValue = !isNaN(af.value) && af.value.trim() !== "";
                const val = isNumericValue ? af.value.trim() : af.value.replace(/'/g, "''").trim();

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
            console.log("Edwww params", params)

            const endpoint = `${Constants.API_URL}/get_exomes`;
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

            const endpoint = `${Constants.API_URL}/get_exomes_stats`;
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
            { columnKey: "", type: "", value: "", logicOp: "AND" }
        ]);
    };

    // Update the updateAdditionalFilter function to reset dependent fields
    const updateAdditionalFilter = (index, key, val) => {
        setAdditionalFilters((prev) => {
            const newFilters = [...prev];
            const currentFilter = newFilters[index];

            // If column is changed, reset type and value
            if (key === "columnKey") {
                newFilters[index] = {
                    ...currentFilter,
                    columnKey: val,
                    type: "", // Reset filter type
                    value: ""  // Reset value
                };
            }
            // If filter type is changed, reset value
            else if (key === "type") {
                newFilters[index] = {
                    ...currentFilter,
                    type: val,
                    value: ""  // Reset value
                };
            }
            // Otherwise just update the field
            else {
                newFilters[index] = { ...currentFilter, [key]: val };
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

    const handleFilterBlur = (index) => {
        const af = additionalFilters[index];
        if (!af) return;
        if (
            [
                "equals",
                "notEquals",
                "contains",
                "notContains",
                "starts",
                "notStarts",
                "ends",
                "notEnds"
            ].includes(af.type)
        ) {
            const val = typedValues[index] || "";
            updateAdditionalFilter(index, "value", val);
        }
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

    // ------------------ Render ------------------
    return (
        <div className="relative p-4 space-y-4">
            <h2 className="text-2xl font-bold">Exomes Table</h2>
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
                    <span>Exomes Configuration</span>
                    <span
                        className={`text-xl transition-transform transform ${showConfigPanel ? "rotate-180" : ""
                            }`}
                    >
                        &#9662; {/* Down Arrow using Unicode */}
                    </span>
                </button>
            </div >

            {/* Side Configuration Panel */}
            {
                true && (
                    <div className={`config-panel ${showConfigPanel ? "show" : ""}`}>

                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Neomer Configuration</h3>
                            <button className="text-lg" onClick={() => setShowConfigPanel(false)}>
                                <FaTimes size={16} />
                            </button>
                        </div>

                        {/* Select length */}
                        <div className="mb-4">
                            <label className="block mb-1 font-medium">Neomer Length:</label>
                            <select
                                className="border px-2 py-1 rounded bg-white hover:bg-gray-50 w-full"
                                value={selectedLength}
                                onChange={(e) => {
                                    setSelectedLength(parseInt(e.target.value, 10));
                                    setAdditionalFilters([]);
                                    setCurrentPage(0);
                                }}
                            >
                                {lengthOptions.map((len) => (
                                    <option key={len} value={len}>
                                        {len}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Visible Columns */}
                        <div className="mb-4">
                            <div className="relative">
                                <button
                                    onClick={() => setShowColumnsDropdown(!showColumnsDropdown)}
                                    className="w-full flex items-center justify-between text-left px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
                                >
                                    <span>Visible Columns</span>
                                    <svg
                                        className={`w-4 h-4 transition-transform transform ${showColumnsDropdown ? "rotate-180" : "rotate-0"
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>
                                {showColumnsDropdown && (
                                    <div
                                        className="border p-1 space-y-4 bg-gray-100 rounded shadow-sm absolute mt-1 z-50 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
                                        style={{ maxHeight: "200px", overflowY: "auto" }}
                                    >
                                        {/* Search Bar */}
                                        <div className="flex items-center mb-2">
                                            <input
                                                type="text"
                                                placeholder="Search columns..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring focus:ring-blue-200 "
                                            />
                                        </div>

                                        {/* Toggle All Checkbox */}
                                        <div className="flex items-center gap-4 p-2 bg-white rounded border shadow-sm">
                                            <input
                                                type="checkbox"
                                                id="toggle-all"
                                                checked={
                                                    visibleColumns.length === columns.length && columns.length > 0
                                                }
                                                onChange={(e) => toggleAllColumns(e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="toggle-all" className="text-sm">
                                                Show All
                                            </label>
                                        </div>

                                        {/* Filtered Columns */}
                                        {columns
                                            .filter((column) =>
                                                column.label.toLowerCase().includes(searchTerm.toLowerCase())
                                            )
                                            .map((column) => (
                                                <div key={column.key} className="flex items-center gap-4 p-2 bg-white rounded border shadow-sm hover:bg-gray-100"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        id={`toggle-${column.key}`}
                                                        checked={visibleColumns.includes(column.key)}
                                                        onChange={() => toggleColumn(column.key)}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <label htmlFor={`toggle-${column.key}`} className="text-sm">
                                                        {column.label}
                                                    </label>
                                                </div>
                                            ))}
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* Filters */}
                        <div className="mb-4">
                            <button
                                className="w-full flex items-center justify-between text-left px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
                                onClick={addFilter}
                            >
                                Add Filter
                            </button>

                            {additionalFilters.length > 0 && (
                                <div className="border p-4 space-y-2 bg-gray-50 filter-columns-panel rounded shadow mt-2">
                                    <div className="flex flex-col space-y-2">
                                        {additionalFilters.map((af, i) => {
                                            const filterTypes =
                                                af.columnKey === "gc_content"
                                                    ? numericFilterTypes.concat(specialFilterTypes)
                                                    : af.columnKey === "donor_age_at_diagnosis" || af.columnKey === "donor_survival_time" || af.columnKey === "donor_interval_of_last_followup" ? numericFilterTypesGeneric.concat(specialFilterTypes) : validAFValues.includes(af.columnKey) ? numericFilterTypeGreaterLess : textFilterTypes.concat(specialFilterTypes);

                                            const currentTypedValue =
                                                typedValues[i] !== undefined ? typedValues[i] : af.value;

                                            return (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-2 flex-wrap relative"
                                                >
                                                    {/* Logic Operator if not the first filter */}
                                                    {i > 0 && (
                                                        <select
                                                            className="border text-sm rounded px-1 py-0.5 bg-white hover:bg-gray-50"
                                                            value={af.logicOp || "AND"}
                                                            onChange={(e) =>
                                                                updateAdditionalFilter(i, "logicOp", e.target.value)
                                                            }
                                                        >
                                                            <option value="AND">AND</option>
                                                            <option value="OR">OR</option>
                                                        </select>
                                                    )}

                                                    {/* Column selector */}
                                                    <div className="relative">
                                                        <div
                                                            className="flex items-center justify-between border text-sm w-64 px-4 py-2 rounded bg-white hover:bg-gray-50 cursor-pointer"
                                                            onClick={() => toggleDropdown(i)}
                                                        >
                                                            {af.columnKey ? columns.find((col) => col.key === af.columnKey)?.label : "Select column"}
                                                            <svg
                                                                className={`w-4 h-4 transition-transform transform ${dropdownStates[i] ? "rotate-180" : "rotate-0"
                                                                    }`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                            </svg>
                                                        </div>

                                                        {dropdownStates[i] && (
                                                            <div
                                                                className="border p-1 space-y-4 bg-gray-100 rounded shadow-sm absolute mt-1 z-50"
                                                                style={{ maxHeight: "200px", overflowY: "auto" }}
                                                            >
                                                                {/* Search Bar */}
                                                                <div className="mb-2">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Search columns..."
                                                                        value={searchTermFilter}
                                                                        onChange={(e) => setSearchTermFilter(e.target.value)}
                                                                        className="w-full border border-gray-300 rounded p-1 text-sm focus:outline-none focus:ring focus:ring-blue-200"
                                                                    />
                                                                </div>

                                                                {/* Options List */}
                                                                {columns
                                                                    .filter((col) =>
                                                                        col.label.toLowerCase().includes(searchTermFilter.toLowerCase())
                                                                    )
                                                                    .map((col) => (
                                                                        <div
                                                                            key={col.key}
                                                                            className="cursor-pointer px-2 py-1 bg-white rounded border shadow-sm hover:bg-gray-100 text-sm"
                                                                            onClick={() => {
                                                                                updateAdditionalFilter(i, "columnKey", col.key);
                                                                                setTypedValues(prev => ({ ...prev, [i]: "" })); // Clear typed value
                                                                                toggleDropdown(i); // Close the dropdown after selection
                                                                            }}
                                                                        >
                                                                            {col.label}
                                                                        </div>
                                                                    ))}

                                                                {columns.filter((col) =>
                                                                    col.label.toLowerCase().includes(searchTermFilter.toLowerCase())
                                                                ).length === 0 && (
                                                                        <div className="text-sm text-gray-500 px-2 py-1">No results found</div>
                                                                    )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Filter Type */}
                                                    <select
                                                        className="border text-sm rounded px-2 py-1 bg-white hover:bg-gray-50"
                                                        value={af.type || ""} // Ensure it defaults to an empty string
                                                        onChange={(e) => updateAdditionalFilter(i, "type", e.target.value)}
                                                    >
                                                        <option value="" disabled>Select filter type</option> {/* Default option */}
                                                        {filterTypes.map((ft) => (
                                                            <option key={ft.value} value={ft.value}>
                                                                {ft.label}
                                                            </option>
                                                        ))}
                                                    </select>


                                                    {/* GC_BETWEEN: 2 fields */}
                                                    {af.type !== "at_least_X_distinct_patients" && af.columnKey === "gc_content" && (
                                                        <>
                                                            {/* A small text or tooltip: */}
                                                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                                Example: 25.21,60.51
                                                            </div>
                                                            <input
                                                                className="border text-sm w-16 rounded px-1"
                                                                type="number"
                                                                placeholder="GC min"
                                                                value={af?.value?.split(",")?.[0] || ""}
                                                                onChange={(e) => {
                                                                    const parts = af.value.split(",");
                                                                    parts[0] = e.target.value;
                                                                    updateAdditionalFilter(i, "value", parts.join(","));
                                                                }}
                                                            />
                                                            <input
                                                                className="border text-sm w-16 rounded px-1"
                                                                type="number"
                                                                placeholder="GC max"
                                                                value={af?.value?.split(",")?.[1] || ""}
                                                                onChange={(e) => {
                                                                    const parts = af.value.split(",");
                                                                    // If there's no second part yet, create one
                                                                    if (parts.length < 2) parts.push("");
                                                                    parts[1] = e.target.value;
                                                                    updateAdditionalFilter(i, "value", parts.join(","));
                                                                }}
                                                            />
                                                        </>
                                                    )}

                                                    {/* at_least_X_distinct_patients */}
                                                    {af.type === "at_least_X_distinct_patients" && (
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm">Count ≥</label>
                                                            <input
                                                                type="number"
                                                                className="border text-sm rounded px-1 w-16"
                                                                placeholder="X"
                                                                value={currentTypedValue}
                                                                onChange={(e) => handleFilterValueChange(i, e.target.value)}
                                                                onBlur={() =>
                                                                    updateAdditionalFilter(i, "value", currentTypedValue)
                                                                }
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Otherwise, text filters */}
                                                    {af.columnKey !== "gc_content" &&
                                                        af.columnKey && (
                                                            <div className="relative">
                                                                <input
                                                                    className="border text-sm rounded px-1"
                                                                    type={af.columnKey === "donor_age_at_diagnosis" || af.columnKey === "donor_survival_time" || af.columnKey === "donor_interval_of_last_followup" ? "number" : "text"}
                                                                    placeholder="Value"
                                                                    value={currentTypedValue}
                                                                    onChange={(e) => handleFilterValueChange(i, e.target.value)}
                                                                    onBlur={() =>
                                                                        updateAdditionalFilter(i, "value", currentTypedValue)
                                                                    }
                                                                />
                                                                {suggestionOpenIndex === i && suggestions.length > 0 && (
                                                                    <div className="absolute bg-white border border-gray-300 z-50 text-sm w-full max-h-40 overflow-y-auto suggestions-dropdown">
                                                                        {suggestions.map((sugg, idx) => (
                                                                            <div
                                                                                key={idx}
                                                                                className="px-2 py-1 hover:bg-gray-200 cursor-pointer"
                                                                                onMouseDown={() => handleSuggestionClick(i, sugg)}
                                                                            >
                                                                                {sugg}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                    {/* Remove filter */}
                                                    <button
                                                        className="text-red-500 text-sm underline"
                                                        onClick={() => removeAdditionalFilter(i)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                            }
                        </div>

                        {/* Remove All Filters */}
                        <button
                            className="w-full flex items-center justify-between text-left px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600 mb-4"
                            onClick={removeAllFiltersHandler}
                        >
                            Remove All Filters
                        </button>

                        {/* Export CSV */}
                        <button
                            className="w-full flex items-center justify-between text-left px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600 mb-4"
                            onClick={handleExportCSV}
                        >
                            Export Selected Rows as CSV
                        </button>

                        {/* Stats Configuration */}
                        <div className="border p-4 space-y-2 bg-gray-50 rounded shadow">
                            <h4 className="text-base font-semibold">Exomes Statistics Configuration</h4>

                            {/* Top N */}
                            <div className="flex items-center gap-2">
                                <label className="whitespace-nowrap">Top N:</label>
                                <input
                                    type="number"
                                    value={topN}
                                    min={1}
                                    className="border px-2 py-1 w-20"
                                    onChange={(e) => setTopN(Number(e.target.value))}
                                />
                            </div>

                            {/* Add Group By */}
                            <div className="flex flex-wrap gap-2 items-center mt-2">
                                <span>Add Group By:</span>
                                <SelectWithSearch columns={columns} handleAddGroupBy={handleAddGroupBy} />
                            </div>

                            {/* Current Group Bys */}
                            {groupByColumns.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2 items-center">
                                    <span className="font-semibold">Current Group By:</span>
                                    {groupByColumns.map((gbCol) => {
                                        const colObj = columns.find((c) => c.key === gbCol);
                                        return (
                                            <div
                                                key={gbCol}
                                                className="px-2 py-1 bg-blue-100 rounded flex items-center gap-2"
                                            >
                                                <span className="text-sm">{colObj?.label || gbCol}</span>
                                                <button
                                                    onClick={() => handleRemoveGroupBy(gbCol)}
                                                    className="text-red-600 text-xs"
                                                >
                                                    x
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div >
                )
            }

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
            <div style={{ marginTop: "64px" }}>
                <h3 className="text-xl font-bold mb-2">Exomes Statistics Table</h3>
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

export default Exomes;
