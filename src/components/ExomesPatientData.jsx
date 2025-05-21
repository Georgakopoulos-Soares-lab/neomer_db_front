import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import * as Constants from "../constants";
import { useNavigate } from "react-router-dom";

const visibleColumnKeys = [
  "bcr_patient_barcode",
  "gender",
  "vital_status",
  "days_to_birth",
  "days_to_death",
  "days_to_last_followup",
  "age_at_initial_pathologic_diagnosis",
  "tumor_tissue_site",
  "radiation_therapy",
  "race",
  "ethnicity",
  "year_of_initial_pathologic_diagnosis",
  "pathologic_T",
  "pathologic_stage",
  "Cancer_Type",
  "Organ"
];

const numericColumns = [
  "days_to_birth",
  "days_to_death",
  "days_to_last_followup",
  "days_to_initial_pathologic_diagnosis",
  "age_at_initial_pathologic_diagnosis",
  "year_of_initial_pathologic_diagnosis",
  "external_beam_radiation_therapy_administered_paraaortic_region_lymph_node_dose"
];

const ExomePatientData = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filters, setFilters] = useState({});
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [expandedValues, setExpandedValues] = useState({});
  const [openedValuesDropdown, setOpenedValuesDropdown] = useState({});
  const [showAdditionalFilters, setShowAdditionalFilters] = useState(false);
  const [additionalFilters, setAdditionalFilters] = useState([]);
  const [cancerTypesDict, setCancerTypesDict] = useState({});
  const [hoveredRowInfo, setHoveredRowInfo] = useState(null);
  const navigate = useNavigate();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".column-dropdown") &&
        !event.target.closest(".value-dropdown")
      ) {
        setShowColumnDropdown(false);
        setOpenedValuesDropdown({});
        setExpandedValues({});
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch data and cancer types on mount
  useEffect(() => {
    fetchData();
    fetchCancerTypes();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(`${Constants.API_URL}/exomes_donor_data`);
      const headers = resp.data.headers; // array of column names
      const rows = resp.data.data;       // array of arrays

      const fetchedColumns = headers.map((h) => ({ key: h, label: h }));
      const rowObjects = rows.map((rowArr) => {
        const obj = {};
        fetchedColumns.forEach((col, i) => {
          obj[col.key] = rowArr[i];
        });
        return obj;
      });

      setColumns(fetchedColumns);
      setVisibleColumns(
        fetchedColumns
          .filter((col) => visibleColumnKeys.includes(col.key))
          .map((col) => col.key)
      );
      setData(rowObjects);
      setTimeout(() => setLoading(false), 300);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch exomes donor data.");
      setLoading(false);
    }
  };

  const fetchCancerTypes = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(`${Constants.API_URL}/cancer_types`);
      const dict = {};
      resp.data.data.forEach((entry) => {
        const key = entry[1];
        dict[key] = entry.filter((_, i) => i !== 1);
      });
      setCancerTypesDict(dict);
      setTimeout(() => setLoading(false), 300);
    } catch (err) {
      console.error("Error fetching cancer types:", err);
    }
  };

  const isNumericColumn = (col) => numericColumns.includes(col);

  const handleFilterChange = (col, type, val) => {
    setFilters((f) => ({
      ...f,
      [col]: { type, value: val, notNull: f[col]?.notNull || false }
    }));
    setCurrentPage(0);
  };

  const handleNotNullChange = (col, checked) => {
    setFilters((f) => ({
      ...f,
      [col]: { ...f[col], notNull: checked }
    }));
    setCurrentPage(0);
  };

  const applyFilters = (row, fobj, col) => {
    const val = row[col];
    if (fobj.notNull && val == null) return false;
    if (!fobj.type) return true;
    if (fobj.value === "null") return val == null;
    if (val == null) return false;

    if (isNumericColumn(col)) {
      const nv = parseFloat(val);
      const fv = parseFloat(fobj.value);
      if (isNaN(nv) || isNaN(fv)) return false;
      switch (fobj.type) {
        case "equals": return nv === fv;
        case "greater": return nv > fv;
        case "less": return nv < fv;
        case "greaterEqual": return nv >= fv;
        case "lessEqual": return nv <= fv;
        default: return true;
      }
    } else {
      const s = String(val).toLowerCase();
      const t = fobj.value.toLowerCase();
      switch (fobj.type) {
        case "equals": return s === t;
        case "contains": return s.includes(t);
        case "starts": return s.startsWith(t);
        case "ends": return s.endsWith(t);
        default: return true;
      }
    }
  };

  const getUniqueValues = (col) => {
    const set = new Set(data.map((r) => r[col]));
    return Array.from(set).sort((a, b) => {
      if (a == null && b == null) return 0;
      if (a == null) return 1;
      if (b == null) return -1;
      return String(a).localeCompare(String(b));
    });
  };

  const toggleColumn = (key) => {
    setVisibleColumns((v) =>
      v.includes(key) ? v.filter((k) => k !== key) : [...v, key]
    );
  };

  const toggleAllColumns = (checked) => {
    setVisibleColumns(checked ? columns.map((c) => c.key) : []);
  };

  const toggleExpandedValues = (col) =>
    setExpandedValues((e) => ({ ...e, [col]: !e[col] }));

  const toggleOpenedValuesDropdown = (col) => {
    setOpenedValuesDropdown((o) => {
      const next = { ...o, [col]: !o[col] };
      if (o[col]) setExpandedValues((e) => ({ ...e, [col]: false }));
      return next;
    });
  };

  const handleValueSelect = (col, val) => {
    handleFilterChange(col, filters[col]?.type || "", val);
    setOpenedValuesDropdown((o) => ({ ...o, [col]: false }));
    setExpandedValues((e) => ({ ...e, [col]: false }));
  };

  const jsonToCSV = (arr) => {
    const keys = Object.keys(arr[0] || {});
    const lines = [keys.join(",")];
    arr.forEach((o) => {
      lines.push(keys.map((k) => o[k]).join(","));
    });
    return lines.join("\n");
  };

  const exportVisibleDataAsCSV = () => {
    const csv = jsonToCSV(paginatedData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "exomes_donor_data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addAdditionalFilter = () =>
    setAdditionalFilters((af) => [
      ...af,
      { columnKey: "", type: "", value: "", notNull: false }
    ]);

  const updateAdditionalFilter = (i, k, v) =>
    setAdditionalFilters((af) => {
      const copy = [...af];
      copy[i] = { ...copy[i], [k]: v };
      return copy;
    });

  const removeAdditionalFilter = (i) =>
    setAdditionalFilters((af) => af.filter((_, idx) => idx !== i));

  const allFiltered = data.filter((row) => {
    const mainOk = Object.entries(filters).every(([col, fobj]) =>
      applyFilters(row, fobj, col)
    );
    if (!mainOk) return false;
    return additionalFilters.every((af) =>
      !af.columnKey ? true : applyFilters(row, af, af.columnKey)
    );
  });

  const totalItems = allFiltered.length;
  const effectivePageSize =
    pageSize === "all" ? totalItems || 1 : Number(pageSize);
  const totalPages =
    pageSize === "all" ? 1 : Math.ceil(totalItems / effectivePageSize);
  const safePage = Math.min(
    currentPage,
    totalPages - 1 < 0 ? 0 : totalPages - 1
  );
  const startIdx = safePage * effectivePageSize;
  const paginatedData =
    pageSize === "all"
      ? allFiltered
      : allFiltered.slice(startIdx, startIdx + effectivePageSize);

  const goPrev = () => safePage > 0 && setCurrentPage(safePage - 1);
  const goNext = () =>
    safePage < totalPages - 1 && setCurrentPage(safePage + 1);

  const handlePageSizeChange = (e) => {
    const v = e.target.value;
    setPageSize(v === "all" ? "all" : Number(v));
    setCurrentPage(0);
  };

  const handleRowClick = (id) => navigate(`/exomes_patient/${id}`);

  const handleRowMouseEnter = (e, row) => {
    const uid = row["bcr_patient_barcode"];
    if (typeof uid === "string") {
      for (const key of Object.keys(cancerTypesDict)) {
        if (uid.includes(key)) {
          const rect = e.currentTarget.getBoundingClientRect();
          setHoveredRowInfo({
            x: rect.left + rect.width / 8,
            y: rect.top - 10,
            info: cancerTypesDict[key]
          });
          return;
        }
      }
    }
    setHoveredRowInfo(null);
  };
  const handleRowMouseLeave = () => setHoveredRowInfo(null);

  return (
    <div className="relative p-4 space-y-4">
      <h2 className="text-2xl font-bold">Exomes Donor Data</h2>

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

      {/* Pagination controls */}
      <div className="flex items-center gap-2 text-sm">
        <span>Show:</span>
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
          className="border px-2 py-1 rounded bg-white hover:bg-gray-50"
        >
          {[10, 20, 30, 40, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
          <option value="all">All</option>
        </select>
        <span>per page</span>
      </div>

      {/* Column toggles & filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative inline-block column-dropdown">
          <button
            className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
            onClick={() => setShowColumnDropdown((v) => !v)}
          >
            Visible Columns
          </button>
          {showColumnDropdown && (
            <div
              className="border p-4 bg-gray-100 rounded shadow-sm absolute mt-1 z-50"
              style={{ maxHeight: "200px", overflowY: "auto", width: "300px" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={visibleColumns.length === columns.length}
                  onChange={(e) => toggleAllColumns(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <label className="text-sm">Show All</label>
              </div>
              {columns.map((col) => (
                <div
                  key={col.key}
                  className="flex items-center gap-2 mb-1"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="text-sm">{col.label}</label>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
          onClick={() => {
            setFilters({});
            setAdditionalFilters([]);
            setCurrentPage(0);
          }}
        >
          Remove All Filters
        </button>

        <button
          className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
          onClick={exportVisibleDataAsCSV}
        >
          Export Visible Data (CSV)
        </button>

        <button
          className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
          onClick={() => setShowAdditionalFilters((v) => !v)}
        >
          Filter Columns
        </button>
      </div>

      {/* Additional filters */}
      {showAdditionalFilters && (
        <div className="border p-4 bg-gray-50 space-y-4 rounded shadow-sm">
          {additionalFilters.map((af, i) => (
            <div
              key={i}
              className="flex flex-wrap gap-4 items-center p-2 bg-white rounded border shadow-sm"
            >
              <select
                value={af.columnKey}
                onChange={(e) =>
                  updateAdditionalFilter(i, "columnKey", e.target.value)
                }
                className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white text-sm"
              >
                <option value="">Select column</option>
                {columns.map((col) => (
                  <option key={col.key} value={col.key}>
                    {col.label}
                  </option>
                ))}
              </select>

              <select
                value={af.type}
                onChange={(e) =>
                  updateAdditionalFilter(i, "type", e.target.value)
                }
                className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white text-sm"
              >
                <option value="">No filter</option>
                {af.columnKey && isNumericColumn(af.columnKey) ? (
                  <>
                    <option value="equals">Equals</option>
                    <option value="greater">Greater than</option>
                    <option value="less">Less than</option>
                    <option value="greaterEqual">Greater or equal</option>
                    <option value="lessEqual">Less or equal</option>
                  </>
                ) : (
                  <>
                    <option value="equals">Equals</option>
                    <option value="contains">Contains</option>
                    <option value="starts">Starts with</option>
                    <option value="ends">Ends with</option>
                  </>
                )}
              </select>

              <input
                type="text"
                placeholder="Value"
                value={af.value}
                onChange={(e) =>
                  updateAdditionalFilter(i, "value", e.target.value.trim())
                }
                className="px-4 py-2 border rounded bg-gray-50 text-sm"
              />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={af.notNull}
                  onChange={(e) =>
                    updateAdditionalFilter(i, "notNull", e.target.checked)
                  }
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                Not Null
              </label>

              <button
                className="text-red-500 text-sm underline"
                onClick={() => removeAdditionalFilter(i)}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            onClick={addAdditionalFilter}
            className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white"
          >
            Add Additional Filter
          </button>
        </div>
      )}

      {/* Data table */}
      <div className="overflow-x-auto relative">
        <table className="min-w-full bg-white border border-gray-300 table-auto shadow-md">
          <thead>
            <tr>
              {visibleColumns.map((colKey) => (
                <th
                  key={colKey}
                  className="p-3 border-b text-center whitespace-nowrap text-sm font-semibold"
                >
                  {colKey}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                className={`cursor-pointer transition-opacity ${
                  idx % 2 === 0 ? "bg-gray-100" : "bg-white"
                } hover:opacity-80`}
                onClick={() =>
                  handleRowClick(row["bcr_patient_barcode"])
                }
                onMouseEnter={(e) => handleRowMouseEnter(e, row)}
                onMouseLeave={handleRowMouseLeave}
              >
                {visibleColumns.map((colKey) => (
                  <td
                    key={colKey}
                    className="p-3 border text-center whitespace-nowrap text-sm"
                  >
                    {row[colKey] == null || row[colKey] === ""
                      ? "Null"
                      : String(row[colKey])}
                  </td>
                ))}
              </tr>
            ))}
            {!paginatedData.length && !loading && (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="p-3 text-center text-gray-500"
                >
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between mt-4 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={goPrev}
            disabled={safePage === 0}
            className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={goNext}
            disabled={safePage >= totalPages - 1}
            className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="text-sm">
          Page {safePage + 1} of {totalPages || 1}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="border px-2 py-1 rounded bg-white hover:bg-gray-50"
          >
            {[10, 20, 30, 40, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
            <option value="all">All</option>
          </select>
          <span>per page</span>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredRowInfo && (
        <div
          className="fixed p-2 border bg-white shadow-lg text-sm"
          style={{ top: hoveredRowInfo.y, left: hoveredRowInfo.x }}
        >
          <div className="font-bold">Cancer Type Info:</div>
          <ul className="list-disc pl-5">
            {hoveredRowInfo.info.map((val, i) => (
              <li key={i}>{val}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExomePatientData;
