// src/components/Exomes.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as Constants from "../constants";
import { FaBars, FaTimes } from "react-icons/fa";
import SelectWithSearch from "./shared/SelectWithSearch";
import "./styles.css";

const lengthOptions = [11, 12, 13, 14, 15, 16];
const pageSizeOptions = [10, 20, 50, 100, 1000];
const defaultVisibleColumnsOrder = [
  "nullomers_created",
  "Cancer_Type",
  "Organ",
  "Hugo_Symbol",
  "Variant_Classification",
  "AF"
];
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
const specialFilterTypes = [
  { value: "at_least_X_distinct_patients", label: "At Least X Distinct Donors" }
];
const numericFilterTypesGeneric = [
  { value: "equals", label: "Equals" },
  { value: "notEquals", label: "Not Equals" },
  { value: "greaterThan", label: "Greater than" },
  { value: "lessThan", label: "Less than" }
];
const validAFValues = [
  "AF", "AF_eas", "AF_afr", "AF_fin", "AF_ami",
  "AF_amr", "AF_nfe", "AF_sas", "AF_asj"
];
const numericFilterTypeGreaterLess = [
  { value: "greaterThan", label: "Greater than" },
  { value: "lessThan", label: "Less than" }
];
const columnLabelMapping = {
  nullomers_created: "Neomers",
  Cancer_Type: "Cancer Type",
  Organ: "Organ",
  Hugo_Symbol: "Hugo Symbol",
  Variant_Classification: "Variant Classification",
  AF: "AF"
};

const Exomes = () => {
  // --- State hooks ---
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

  // filters / suggestions
  const [additionalFilters, setAdditionalFilters] = useState([]);
  const [typedValues, setTypedValues] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionOpenIndex, setSuggestionOpenIndex] = useState(null);
  const suggestionCancelToken = useRef(null);

  // neomer length
  const [selectedLength, setSelectedLength] = useState(11);

  // stats table
  const [statsData, setStatsData] = useState([]);
  const [statsColumns, setStatsColumns] = useState([]);
  const [groupByColumns, setGroupByColumns] = useState([]);
  const [topN, setTopN] = useState(10);

  // config panel toggles
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);

  // close suggestions on outside click
  useEffect(() => {
    const handler = e => {
      if (
        suggestionOpenIndex !== null &&
        !e.target.closest(".suggestions-dropdown")
      ) {
        setSuggestions([]);
        setSuggestionOpenIndex(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [suggestionOpenIndex]);

  const numericCols = [
    ...validAFValues,
    // "gc_content",
    "days_to_birth",
    "days_to_death",
    "days_to_last_followup"
  ];

  // helper to block fetch while filters incomplete
  const hasIncompleteFilter = () =>
    additionalFilters.some(af => {
      if (af.type === "gc_between" || validAFValues.includes(af.columnKey)) {
        const parts = af.value.split(",");
        return parts.length < 2 || !parts[0] || !parts[1];
      }
      if (af.type === "at_least_X_distinct_patients") {
        return !af.value;
      }
      return !af.columnKey || !af.type || !af.value;
    });

  // re-fetch main table when deps change
  useEffect(() => {
    if (!hasIncompleteFilter()) fetchData();
  }, [selectedLength, currentPage, pageSize, additionalFilters]);

  // re-fetch stats table when deps change
  useEffect(() => {
    if (!hasIncompleteFilter()) fetchStatsData();
  }, [selectedLength, additionalFilters, groupByColumns, topN]);

  // build WHERE from additionalFilters
  const buildFiltersQuery = () => {
    if (additionalFilters.length === 0) return "";
    let conditions = "";
    additionalFilters.forEach((af, i) => {
      let cond = "";
      // GC‐between
      if (af.type === "gc_between") {
        const [min, max] = af.value.split(",");
        cond = `(gc_content > ${parseFloat(min).toFixed(2)} AND gc_content < ${parseFloat(max).toFixed(2)})`;
      }
      // AF slider ranges
      else if (validAFValues.includes(af.columnKey)) {
        const [min, max] = af.value.split(",");
        cond = `(${af.columnKey} >= ${parseFloat(min).toFixed(2)} AND ${af.columnKey} <= ${parseFloat(max).toFixed(2)})`;
      }
      // special count filter
      else if (af.type === "at_least_X_distinct_patients") {
        return; // handled separately
      }
      // everything else: equals, contains, greaterThan, lessThan, etc
      else {
        const col = af.columnKey;
        const v = af.value.replace(/'/g, "''");
        switch (af.type) {
          case "equals":
            cond = `(${col} = '${v}')`;
            break;
          case "notEquals":
            cond = `(${col} <> '${v}')`;
            break;
          case "starts":
            cond = `(${col} LIKE '${v}%')`;
            break;
          case "notStarts":
            cond = `(${col} NOT LIKE '${v}%')`;
            break;
          case "ends":
            cond = `(${col} LIKE '%${v}')`;
            break;
          case "notEnds":
            cond = `(${col} NOT LIKE '%${v}')`;
            break;
          case "contains":
            cond = `(${col} LIKE '%${v}%')`;
            break;
          case "notContains":
            cond = `(${col} NOT LIKE '%${v}%')`;
            break;
          case "greaterThan":
            cond = `(${col} > ${v})`;
            break;
          case "lessThan":
            cond = `(${col} < ${v})`;
            break;
          default:
            return;
        }
      }
      if (!cond) return;
      const op = af.logicOp || "AND";
      conditions += (i > 0 ? ` ${op} ` : "") + cond;
    });
    return conditions;
  };

  // special filters string
  const buildSpecialFiltersString = () =>
    additionalFilters
      .filter(af => af.type === "at_least_X_distinct_patients" && af.value)
      .map(af => `at_least_X_distinct_patients;${af.value}`)
      .join("|");

  // fetch main data
  async function fetchData() {
    setLoading(true);
    try {
      const filtersStr = buildFiltersQuery();
      const specialStr = buildSpecialFiltersString();
      const params = {
        length: selectedLength,
        page: currentPage,
        limit: pageSize
      };
      if (filtersStr) params.filters = filtersStr;
      if (specialStr) params.specialFilters = specialStr;

      const resp = await axios.get(
        `${Constants.API_URL}/get_exome_nullomers`,
        { params }
      );
      const { headers, data: rows, totalCount } = resp.data;

      setTotalCount(totalCount);
      setTotalPages(Math.ceil(totalCount / pageSize));

      setColumns(
        headers.map(h => ({ key: h, label: columnLabelMapping[h] || h }))
      );
      setData(
        rows.map(r =>
          headers.reduce((obj, h, i) => {
            obj[h] = r[i];
            return obj;
          }, {})
        )
      );
      if (!visibleColumns.length) {
        setVisibleColumns(
          defaultVisibleColumnsOrder.filter(h => headers.includes(h))
        );
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }

  // fetch stats
  async function fetchStatsData() {
    setLoading(true);
    try {
      const filtersStr = buildFiltersQuery();
      const specialStr = buildSpecialFiltersString();
      const groupBy = groupByColumns.map(c => `"${c}"`).join(",");
      const params = {
        length: selectedLength,
        filters: filtersStr,
        groupBy,
        topN
      };
      if (specialStr) params.specialFilters = specialStr;

      const resp = await axios.get(
        `${Constants.API_URL}/get_exome_nullomers_stats`,
        { params }
      );
      const { headers, data: rows } = resp.data;

      setStatsColumns(
        headers.map(h => ({ key: h, label: columnLabelMapping[h] || h }))
      );
      setStatsData(
        rows.map(r =>
          headers.reduce((obj, h, i) => {
            obj[h] = r[i];
            return obj;
          }, {})
        )
      );
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch stats.");
    } finally {
      setLoading(false);
    }
  }

  // add / update / remove filters
  function addFilter() {
    setAdditionalFilters(f => [
      ...f,
      { columnKey: "", type: "", value: "", logicOp: "AND" }
    ]);
  }
  function updateAdditionalFilter(index, key, val) {
    setAdditionalFilters(f => {
      const nf = [...f];
      const cur = nf[index];
  
      if (key === "columnKey") {
        if (val === "gc_content") {
          // Always force gc_between for GC content
          nf[index] = {
            ...cur,
            columnKey: val,
            type: "gc_between",
            value: "0.00,1.00"
          };
        } else if (validAFValues.includes(val)) {
          // AF_* columns
          nf[index] = {
            ...cur,
            columnKey: val,
            type: "between",
            value: "0.00,1.00"
          };
        } else {
          // Everything else
          nf[index] = { ...cur, columnKey: val, type: "", value: "" };
        }
      }
      else if (key === "type") {
        if (cur.columnKey === "gc_content") {
          // Ignore any other type for GC content
          nf[index] = { ...cur, type: "gc_between" };
        } else {
          // Honor user choice for other types
          nf[index] = { ...cur, type: val, value: "" };
        }
      }
      else {
        // value or logicOp updates
        nf[index] = { ...cur, [key]: val };
      }
  
      return nf;
    });
  }


  function removeAdditionalFilter(index) {
    setAdditionalFilters(f => f.filter((_, i) => i !== index));
  }

  // suggestions
  async function handleFilterValueChange(index, newValue) {
    
      const af = additionalFilters[index];

      // always update the controlled value
      setTypedValues(tv => ({ ...tv, [index]: newValue }));

      // only fetch suggestions for non-numeric or equals/notEquals filters
      if (
        !af.columnKey ||
        !af.type ||
        af.type === "gc_between" ||
        af.type === "at_least_X_distinct_patients" ||
        (numericCols.includes(af.columnKey) &&
          !(af.type === "equals" || af.type === "notEquals"))
      ) {
        setSuggestions([]);
        return;
      }

    if (suggestionCancelToken.current) {
      suggestionCancelToken.current.cancel();
    }
    suggestionCancelToken.current = axios.CancelToken.source();

    try {
      const params = {
        column: af.columnKey,
        input: newValue,
        length: selectedLength
      };
      const resp = await axios.get(
        `${Constants.API_URL}/get_exome_suggestions`,
        { params, cancelToken: suggestionCancelToken.current.token }
      );
      setSuggestions(resp.data.suggestions);
      setSuggestionOpenIndex(index);
    } catch (err) {
      if (!axios.isCancel(err)) console.error(err);
    }
  }
  function handleSuggestionClick(index, sug) {
    setSuggestions([]);
    setSuggestionOpenIndex(null);
    setTypedValues(tv => ({ ...tv, [index]: sug }));
    updateAdditionalFilter(index, "value", sug);
  }

  // AF slider
  function handleAFSliderChange(index, which, rawVal) {
    const val = parseFloat(rawVal).toFixed(2);
    const parts = (additionalFilters[index].value || "0.00,1.00").split(",");
    const min = which === "min" ? val : parts[0];
    const max = which === "max" ? val : parts[1];
    if (parseFloat(min) > parseFloat(max)) return;
    updateAdditionalFilter(index, "value", `${min},${max}`);
  }

  // pagination & selection & export
  function toggleRowSelection(idx) {
    setSelectedRows(sr =>
      sr.includes(idx) ? sr.filter(x => x !== idx) : [...sr, idx]
    );
  }
  function toggleSelectAllRows() {
    if (selectedRows.length === data.length && data.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map((_, i) => i));
    }
  }
  function handleExportCSV() {
    const rows = selectedRows.map(i => data[i]);
    if (rows.length === 0) {
      alert("No rows selected.");
      return;
    }
    const headersStr = visibleColumns
      .map(k => `"${columns.find(c => c.key === k)?.label || k}"`)
      .join(",");
    const csvRows = rows.map(r =>
      visibleColumns
        .map(k => {
          const v = r[k] == null ? "" : String(r[k]).replace(/"/g, '""');
          return `"${v}"`;
        })
        .join(",")
    );
    const csv = [headersStr, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exome_nullomers.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // stats grouping
  function handleAddGroupBy(colKey) {
    if (!groupByColumns.includes(colKey)) {
      setGroupByColumns(g => [...g, colKey]);
    }
  }
  function handleRemoveGroupBy(colKey) {
    setGroupByColumns(g => g.filter(x => x !== colKey));
  }

  // page controls
  function goToPreviousPage() {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  }
  function goToNextPage() {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  }
  function handlePageSizeChange(e) {
    setPageSize(+e.target.value);
    setCurrentPage(0);
  }

  // visible columns toggles
  function toggleColumn(key) {
    setVisibleColumns(vc =>
      vc.includes(key) ? vc.filter(x => x !== key) : [...vc, key]
    );
  }
  function toggleAllColumns(checked) {
    setVisibleColumns(checked ? columns.map(c => c.key) : []);
  }

  return (
    <div className="relative p-4 space-y-4">
      <h2 className="text-2xl font-bold">Exome Neomers Table</h2>

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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}

      {/* Hamburger */}
      <div className="fixed top-4 right-4 z-50 m-4">
        <button
          className="flex items-center gap-2 bg-white text-gray-700 font-medium shadow-lg px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
          onClick={() => setShowConfigPanel(!showConfigPanel)}
        >
          <span>Exome Configuration</span>
          <FaBars
            className={`text-xl transition-transform transform ${
              showConfigPanel ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Config Drawer */}
      {showConfigPanel && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowConfigPanel(false)}
          />
          <aside
            className={`fixed top-0 right-0 h-full w-[50rem] bg-white z-50 transform ${
              showConfigPanel ? "translate-x-0" : "translate-x-full"
            } transition-transform duration-300 ease-in-out shadow-2xl overflow-y-auto`}
          >
            <div className="p-6 flex items-center justify-between border-b">
              <h3 className="text-xl font-semibold">Exome Configuration</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfigPanel(false)}
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Neomer Length */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Neomer Length
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2 focus:ring-blue-400"
                  value={selectedLength}
                  onChange={e => {
                    setSelectedLength(+e.target.value);
                    setAdditionalFilters([]);
                    setCurrentPage(0);
                  }}
                >
                  {lengthOptions.map(len => (
                    <option key={len} value={len}>
                      {len}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visible Columns */}
              <div>
                <button
                  className="w-full flex justify-between items-center bg-gradient-to-r from-blue-400 to-blue-500 text-white px-4 py-2 rounded-md"
                  onClick={() => setShowColumnsDropdown(!showColumnsDropdown)}
                >
                  <span>Visible Columns</span>
                  <FaBars
                    className={`${showColumnsDropdown ? "rotate-180" : ""} transition-transform`}
                  />
                </button>
                {showColumnsDropdown && (
                  <div className="mt-2 border rounded-md bg-gray-50 shadow p-4 max-h-64 overflow-auto">
                    <input
                      type="text"
                      placeholder="Search columns…"
                      className="w-full mb-3 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-300"
                    />
                    <div className="flex items-center mb-3">
                      <input
                        id="toggle-all-cols"
                        type="checkbox"
                        checked={
                          visibleColumns.length === columns.length && columns.length > 0
                        }
                        onChange={e => toggleAllColumns(e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="toggle-all-cols" className="text-sm">
                        Show All
                      </label>
                    </div>
                    {columns.map(col => (
                      <div key={col.key} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(col.key)}
                          onChange={() => toggleColumn(col.key)}
                          className="mr-2"
                        />
                        <label className="text-sm">{col.label}</label>
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
                    className="text-blue-600 hover:underline text-sm"
                    onClick={addFilter}
                  >
                    + Add Filter
                  </button>
                </div>
                {additionalFilters.map((af, i) => { 
                  // parse out current fraction values and convert to integer percent
                  const [minStr = "0.00", maxStr = "1.00"] = af.value.split(",");
                  const minPct = (parseFloat(minStr) * 100).toFixed(0);
                  const maxPct = (parseFloat(maxStr) * 100).toFixed(0);
                  return (
                  <div key={i} className="grid grid-cols-3 gap-3 items-end mb-4">
                    {/* Column selector */}
                    <div>
                      <label className="text-xs text-gray-600">Column</label>
                      <select
                        className="w-full border rounded px-2 py-1"
                        value={af.columnKey}
                        onChange={e =>
                          updateAdditionalFilter(i, "columnKey", e.target.value)
                        }
                      >
                        <option value="">Select…</option>
                        {columns.map(col => (
                          <option key={col.key} value={col.key}>
                            {col.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Type selector */}
                    <div>
                      <label className="text-xs text-gray-600">Type</label>
                      {validAFValues.includes(af.columnKey) ? (
                        <select
                          disabled
                          className="w-full border rounded px-2 py-1 bg-gray-100 text-gray-500"
                        >
                          <option value="between">Between</option>
                        </select>
                      ) : (
                        <select
                          className="w-full border rounded px-2 py-1"
                          value={af.type}
                          onChange={e =>
                            updateAdditionalFilter(i, "type", e.target.value)
                          }
                        >
                          <option value="">Select…</option>
                          {(
                      af.columnKey === "gc_content"
                        ? [{ value: "gc_between", label: "GC Between (%)" }].concat(specialFilterTypes)
                              : validAFValues.includes(af.columnKey)
                              ? numericFilterTypeGreaterLess
                              : ["days_to_birth", "days_to_death", "days_to_last_followup"].includes(
                                  af.columnKey
                                )
                              ? numericFilterTypesGeneric.concat(specialFilterTypes)
                              : textFilterTypes.concat(specialFilterTypes)
                          ).map(ft => (
                            <option key={ft.value} value={ft.value}>
                              {ft.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Value / input / sliders */}
                    <div>
                      <label className="text-xs text-gray-600">&nbsp;</label>

                      {af.type === "gc_between" ? (
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="min %"
                          className="w-1/2 border rounded px-2 py-1"
                          min={0}
                          max={100}
                          value={minPct}
                          onChange={e => {
                            const parts = af.value.split(",");
                            parts[0] = (parseFloat(e.target.value) / 100).toFixed(2);
                            updateAdditionalFilter(i, "value", parts.join(","));
                          }}
                        />
                        <input
                          type="number"
                          placeholder="max %"
                          className="w-1/2 border rounded px-2 py-1"
                          min={0}
                          max={100}
                          value={maxPct}
                          onChange={e => {
                            const parts = af.value.split(",");
                            parts[1] = (parseFloat(e.target.value) / 100).toFixed(2);
                            updateAdditionalFilter(i, "value", parts.join(","));
                          }}
                        />
                        </div>
                      ) : af.type === "at_least_X_distinct_patients" ? (
                        <input
                          type="number"
                          placeholder="Count ≥"
                          className="w-full border rounded px-2 py-1"
                          value={typedValues[i] || af.value}
                          onChange={e =>
                            handleFilterValueChange(i, e.target.value)
                          }
                          onBlur={() =>
                            updateAdditionalFilter(i, "value", typedValues[i] || af.value)
                          }
                        />
                      ) : validAFValues.includes(af.columnKey) ? (
                        <div className="space-y-2">
                          {(() => {
                            const [min = "0.00", max = "1.00"] = af.value.split(",");
                            return (
                              <div className="flex justify-between text-xs text-gray-700 mb-1">
                                <span>Min: {parseFloat(min).toFixed(2)}</span>
                                <span>Max: {parseFloat(max).toFixed(2)}</span>
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
                            type={
                              ["greaterThan", "lessThan"].includes(af.type)
                                ? "number"
                                : "text"
                            }
                            className="w-full border rounded px-2 py-1"
                            placeholder="Enter value…"
                            value={typedValues[i] || af.value}
                            onChange={e =>
                              handleFilterValueChange(i, e.target.value)
                            }
                            onBlur={() =>
                              updateAdditionalFilter(
                                i,
                                "value",
                                typedValues[i] || af.value
                              )
                            }
                          />
                          {suggestionOpenIndex === i && suggestions.length > 0 && (
                            <ul className="absolute top-full left-0 right-0 bg-white border rounded mt-1 max-h-32 overflow-auto z-10 suggestions-dropdown">
                              {suggestions.map(sug => (
                                <li
                                  key={sug}
                                  className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                                  onMouseDown={() =>
                                    handleSuggestionClick(i, sug)
                                  }
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
                )}
                
                )}
              </div>

              {/* Clear & Export */}
              <div className="mt-6 space-y-3">
                <button
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                  onClick={() => {
                    setAdditionalFilters([]);
                    setCurrentPage(0);
                  }}
                >
                  Clear All Filters
                </button>
                <button
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                  onClick={handleExportCSV}
                >
                  Export Selected CSV
                </button>
              </div>

              {/* Stats Config */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Stats Configuration</h4>
                <div className="flex items-center mb-4">
                  <label className="mr-2">Top N:</label>
                  <input
                    type="number"
                    min={1}
                    className="w-20 border rounded px-2 py-1"
                    value={topN}
                    onChange={e => setTopN(+e.target.value)}
                  />
                </div>
                <div>
                  <label className="block mb-1">Group By:</label>
                  <SelectWithSearch
                    columns={columns}
                    handleAddGroupBy={handleAddGroupBy}
                  />
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
                              className="ml-1 text-red-600"
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
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border table-auto">
          <thead>
            <tr>
              <th className="p-3 border text-center">
                <input
                  type="checkbox"
                  checked={selectedRows.length === data.length && data.length > 0}
                  onChange={toggleSelectAllRows}
                />
              </th>
              {visibleColumns.map(key => {
                const col = columns.find(c => c.key === key);
                return (
                  <th
                    key={key}
                    className="p-3 border text-center whitespace-nowrap"
                  >
                    <div className="font-semibold text-sm">
                      {col?.label || key}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={visibleColumns.length + 1}
                  className="p-2 text-center text-gray-500"
                >
                  No data found.
                </td>
              </tr>
            )}
            {data.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-gray-100" : ""}>
                <td className="p-3 border text-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(ri)}
                    onChange={() => toggleRowSelection(ri)}
                  />
                </td>
                {visibleColumns.map(key => (
                  <td
                    key={key}
                    className="p-3 border text-center whitespace-nowrap"
                  >
                    {row[key] == null ? "Null" : String(row[key]) || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 0}
            className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white"
          >
            Previous
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages - 1}
            className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white"
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
            className="border px-2 py-1 rounded"
          >
            {pageSizeOptions.map(sz => (
              <option key={sz} value={sz}>
                {sz}
              </option>
            ))}
          </select>
          <span>per page</span>
        </div>
      </div>

      {/* Stats Table */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-2">Exome Neomer Statistics Table</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border table-auto">
            <thead>
              <tr>
                {statsColumns.map(col => (
                  <th
                    key={col.key}
                    className="p-3 border whitespace-nowrap text-center"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statsData.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={statsColumns.length}
                    className="p-2 text-center text-gray-500"
                  >
                    No data found.
                  </td>
                </tr>
              )}
              {statsData.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-gray-100" : ""}>
                  {statsColumns.map(col => (
                    <td
                      key={col.key}
                      className="p-3 border text-center whitespace-nowrap"
                    >
                      {row[col.key] == null ? "Null" : String(row[col.key]) || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 mt-4 text-sm">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="border px-2 py-1 rounded"
          >
            {pageSizeOptions.map(sz => (
              <option key={sz} value={sz}>
                {sz}
              </option>
            ))}
          </select>
          <span>per page</span>
        </div>
      </div>
    </div>
  );
};

export default Exomes;
