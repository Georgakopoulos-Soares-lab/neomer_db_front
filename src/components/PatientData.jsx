import React, { useState, useEffect } from "react"
import axios from "axios"
import * as Constants from "../constants"
import { useNavigate } from "react-router-dom";


const visibleColumnKeys = [
  "# donor_unique_id",
  "icgc_donor_id",
  "donor_sex",
  "donor_vital_status",
  "donor_diagnosis_icd10",
  "first_therapy_type",
  "first_therapy_response",
  "donor_age_at_diagnosis",
  "donor_survival_time",
  "donor_interval_of_last_followup",
  "tobacco_smoking_history_indicator",
  "tobacco_smoking_intensity",
  "alcohol_history",
  "alcohol_history_intensity"
]

const numericColumns = [
  "donor_age_at_diagnosis",
  "donor_survival_time",
  "donor_interval_of_last_followup",
  "tobacco_smoking_intensity"
]

const PatientData = () => {
  const [data, setData] = useState([])
  const [columns, setColumns] = useState([])
  const [filters, setFilters] = useState({})
  const [visibleColumns, setVisibleColumns] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [showColumnDropdown, setShowColumnDropdown] = useState(false)
  const [expandedValues, setExpandedValues] = useState({})
  const [openedValuesDropdown, setOpenedValuesDropdown] = useState({})


  // Additional filters
  const [showAdditionalFilters, setShowAdditionalFilters] = useState(false)
  const [additionalFilters, setAdditionalFilters] = useState([])

  // Cancer types dictionary
  const [cancerTypesDict, setCancerTypesDict] = useState({})

  // Hover state
  const [hoveredRowInfo, setHoveredRowInfo] = useState(null)

  // Navigation
  const navigate = useNavigate()


  useEffect(() => {
    const handleClickOutside = event => {
      const target = event.target
      if (
        !target.closest(".column-dropdown") &&
        !target.closest(".value-dropdown")
      ) {
        setShowColumnDropdown(false)
        setOpenedValuesDropdown({})
        setExpandedValues({})
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    fetchData()
    fetchCancerTypes()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const endpoint = Constants.API_URL + "/donor_data"
      const response = await axios.get(endpoint)

      const fetchedHeaders = response.data.headers
      const fetchedData = response.data.data

      const fetchedColumns = fetchedHeaders.map(header => ({
        key: header,
        label: header
      }))

      const rowObjects = fetchedData.map(rowArray => {
        const rowObj = {}
        fetchedColumns.forEach((col, i) => {
          rowObj[col.key] = rowArray[i]
        })
        return rowObj
      })

      setColumns(fetchedColumns)

      const initialVisibleColumns = fetchedColumns
        .filter(column => visibleColumnKeys.includes(column.key))
        .map(column => column.key)

      setVisibleColumns(initialVisibleColumns)
      setData(rowObjects)
      setTimeout(() => {
        setLoading(false)
      }, 300)

    } catch (error) {
      setLoading(false)
      console.error("Error fetching data:", error)
      setError(
        "Failed to fetch data. Please check the console for more details."
      )
    }
  }

  const fetchCancerTypes = async () => {
    try {
      setLoading(true)
      const endpoint = Constants.API_URL + "/cancer_types"
      const response = await axios.get(endpoint)

      // const fetchedHeaders: string[] = response.data.headers;
      const fetchedData = response.data.data
      // response.data is an array of arrays like:
      // [
      //   ["Bladder Urothelial Carcinoma", "BLCA", "TCGA", "Bladder"],
      //   ["Bone Cancer", "BOCA", "ICGC", "Bone_SoftTissue"],
      //   ...
      // ]
      const dict = {}
      fetchedData.forEach(entry => {
        // Key is entry[1], values are all other entries except entry[1].
        const key = entry[1]
        const values = entry.filter((_, i) => i !== 1)
        dict[key] = values
      })
      setCancerTypesDict(dict)
      //console.log(dict)
      setTimeout(() => {
        setLoading(false)
      }, 300)
    } catch (error) {
      console.error("Error fetching cancer types:", error)
    }
  }

  const handleFilterChange = (columnKey, filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [columnKey]: {
        type: filterType,
        value: value,
        notNull: prevFilters[columnKey]?.notNull || false
      }
    }))
    setCurrentPage(0)
  }

  const handleNotNullChange = (columnKey, checked) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [columnKey]: {
        type: prevFilters[columnKey]?.type || "",
        value: prevFilters[columnKey]?.value || "",
        notNull: checked
      }
    }))
    setCurrentPage(0)
  }

  const removeAllFilters = () => {
    setFilters({})
    setAdditionalFilters([])
    setCurrentPage(0)
  }

  const toggleColumn = columnKey => {
    setVisibleColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    )
  }

  const toggleAllColumns = checked => {
    setVisibleColumns(checked ? columns.map(column => column.key) : [])
  }

  const getUniqueValues = columnKey => {
    const values = data.map(row => row[columnKey])
    const uniqueValues = Array.from(new Set(values))

    return uniqueValues.sort((a, b) => {
      if (a === null && b === null) return 0
      if (a === null) return 1
      if (b === null) return -1
      return String(a).localeCompare(String(b))
    })
  }

  const toggleExpandedValues = colKey => {
    setExpandedValues(prev => ({
      ...prev,
      [colKey]: !prev[colKey]
    }))
  }

  const toggleOpenedValuesDropdown = colKey => {
    setOpenedValuesDropdown(prev => ({
      ...prev,
      [colKey]: !prev[colKey]
    }))
    if (openedValuesDropdown[colKey]) {
      setExpandedValues(prev => ({ ...prev, [colKey]: false }))
    }
  }

  const handleValueSelect = (colKey, val) => {
    handleFilterChange(colKey, filters[colKey]?.type || "", val)
    setOpenedValuesDropdown(prev => ({ ...prev, [colKey]: false }))
    setExpandedValues(prev => ({ ...prev, [colKey]: false }))
  }

  const isNumericColumn = colKey => numericColumns.includes(colKey)

  const handleRowClick = (donorId) => {
    navigate(`/patient/${donorId}`)
  }

  const renderFilterTypeDropdown = (colKey, colFilters) => {
    const numeric = isNumericColumn(colKey)
    return (
      <select
        value={colFilters.type || ""}
        onChange={e =>
          handleFilterChange(colKey, e.target.value, colFilters.value)
        }
        className="text-sm mb-1 w-full border"
        style={{ boxSizing: "border-box" }}
      >
        <option value="">No filter</option>
        {numeric ? (
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
    )
  }

  const renderValueDropdown = (colKey, colFilters, uniqueValues) => {
    const expanded = expandedValues[colKey] || false
    const opened = openedValuesDropdown[colKey] || false

    let displayedValues = uniqueValues
    let moreCount = 0
    if (!expanded && uniqueValues.length > 10) {
      displayedValues = uniqueValues.slice(0, 10)
      moreCount = uniqueValues.length - 10
    }

    const currentValue = colFilters.value || ""

    return (
      <div className="relative inline-block w-full value-dropdown">
        <button
          type="button"
          className="w-full text-left border bg-white text-sm p-1"
          onClick={() => toggleOpenedValuesDropdown(colKey)}
        >
          {currentValue === ""
            ? "Any value"
            : currentValue === "null"
              ? "Null"
              : currentValue}
        </button>
        {opened && (
          <div
            className="absolute border border-gray-300 bg-white p-2 mt-1 z-50"
            style={{ maxHeight: "200px", overflowY: "auto", width: "200px" }}
          >
            <div className="font-bold text-sm mb-1">Select a value</div>
            <div
              className="cursor-pointer hover:bg-gray-200 p-1"
              onClick={() => handleValueSelect(colKey, "")}
            >
              Any value
            </div>
            {!expanded &&
              displayedValues.map(val => (
                <div
                  key={val === null ? "null" : val}
                  className="cursor-pointer hover:bg-gray-200 p-1"
                  onClick={() =>
                    handleValueSelect(colKey, val === null ? "null" : val)
                  }
                >
                  {val === null ? "Null" : val}
                </div>
              ))}
            {!expanded && moreCount > 0 && (
              <div
                className="cursor-pointer hover:bg-gray-200 p-1 font-semibold"
                onClick={() => toggleExpandedValues(colKey)}
              >
                and {moreCount} more...
              </div>
            )}
            {expanded && (
              <>
                {uniqueValues.map(val => (
                  <div
                    key={val === null ? "null" : val}
                    className="cursor-pointer hover:bg-gray-200 p-1"
                    onClick={() =>
                      handleValueSelect(colKey, val === null ? "null" : val)
                    }
                  >
                    {val === null ? "Null" : val}
                  </div>
                ))}
                <div className="text-center mt-2">
                  <button
                    className="text-sm underline"
                    onClick={() => toggleExpandedValues(colKey)}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    )
  }
  // Helper function to convert an array of jsons to CSV
  const jsonToCSV = (jsonArray) => {
    const keys = Object.keys(jsonArray[0]);
    const csv = [keys.join(",")]; // Header row

    jsonArray.forEach((item) => {
      const row = keys.map((key) => item[key]);
      csv.push(row.join(","));
    });

    return csv.join("\n");
  };


  const exportVisibleDataAsCSV = () => {
    const csvContent = jsonToCSV(paginatedData);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    //saveAs(blob, "data.csv");

    // no extra module used to save as 
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "patient_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Additional filters handling
  const addAdditionalFilter = () => {
    // Add a blank additional filter
    setAdditionalFilters(prev => [
      ...prev,
      { columnKey: "", type: "", value: "", notNull: false }
    ])
  }

  const updateAdditionalFilter = (index, key, val) => {
    setAdditionalFilters(prev => {
      const newFilters = [...prev]
      newFilters[index] = { ...newFilters[index], [key]: val }
      return newFilters
    })
  }

  const removeAdditionalFilter = index => {
    setAdditionalFilters(prev => prev.filter((_, i) => i !== index))
  }

  const applyFilters = (row, filterObj, columnKey) => {
    const { type, value, notNull } = filterObj
    const cellValue = row[columnKey]

    // Not Null check
    if (notNull && cellValue === null) {
      return false
    }

    if (type === "" || type === "noFilter") {
      return true
    }

    // Null check for value-based filters
    if (value === "null") {
      return cellValue === null
    }

    if (cellValue === null) {
      return false
    }

    if (isNumericColumn(columnKey)) {
      const numValue = parseFloat(cellValue)
      const numFilterVal = parseFloat(value)
      if (isNaN(numValue) || isNaN(numFilterVal)) {
        return false
      }
      switch (type) {
        case "equals":
          return numValue === numFilterVal
        case "greater":
          return numValue > numFilterVal
        case "less":
          return numValue < numFilterVal
        case "greaterEqual":
          return numValue >= numFilterVal
        case "lessEqual":
          return numValue <= numFilterVal
        default:
          return true
      }
    } else {
      const lowerVal = String(cellValue).toLowerCase()
      const fValLower = value.toLowerCase()
      switch (type) {
        case "equals":
          return lowerVal === fValLower
        case "contains":
          return lowerVal.includes(fValLower)
        case "starts":
          return lowerVal.startsWith(fValLower)
        case "ends":
          return lowerVal.endsWith(fValLower)
        default:
          return true
      }
    }
  }

  // Combine all filters (main + additional)
  const allFilteredData = data.filter(row => {
    // Main column filters
    const mainPass = Object.entries(filters).every(([columnKey, filterObj]) =>
      applyFilters(row, filterObj, columnKey)
    )
    if (!mainPass) return false

    // Additional filters
    const additionalPass = additionalFilters.every(af => {
      if (!af.columnKey) return true // skip blank filters
      return applyFilters(row, af, af.columnKey)
    })

    return additionalPass
  })

  const totalItems = allFilteredData.length
  const effectivePageSize =
    pageSize === "all" ? totalItems || 1 : Number(pageSize)
  const totalPages =
    pageSize === "all" ? 1 : Math.ceil(totalItems / effectivePageSize)
  const safeCurrentPage = Math.min(
    currentPage,
    totalPages - 1 < 0 ? 0 : totalPages - 1
  )
  const startIndex = safeCurrentPage * effectivePageSize
  const endIndex = startIndex + effectivePageSize
  const paginatedData =
    pageSize === "all"
      ? allFilteredData
      : allFilteredData.slice(startIndex, endIndex)

  const goToPreviousPage = () => {
    if (safeCurrentPage > 0) {
      setCurrentPage(safeCurrentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (safeCurrentPage < totalPages - 1) {
      setCurrentPage(safeCurrentPage + 1)
    }
  }

  const handlePageSizeChange = e => {
    const val = e.target.value
    if (val === "all") {
      setPageSize("all")
    } else {
      setPageSize(Number(val))
    }
    setCurrentPage(0)
  }

  const handleRowMouseEnter = (e, row) => {
    const donorUniqueId = row["# donor_unique_id"] // or whichever column contains the project code
    console.log(donorUniqueId)
    if (typeof donorUniqueId === "string") {
      for (const key of Object.keys(cancerTypesDict)) {
        if (donorUniqueId.includes(key)) {
          // Found a match
          const rect = e.currentTarget.getBoundingClientRect()

          // Set tooltip position exactly above the hovered cell
          setHoveredRowInfo({
            x: rect.left + rect.width / 8, // Center the tooltip horizontally
            y: rect.top - 10, // Slightly above the cell
            info: cancerTypesDict[key]
          })
          return
        }
      }
    }
    setHoveredRowInfo(null)
  }

  const handleRowMouseLeave = () => {
    setHoveredRowInfo(null)
  }

  return (
    <div className="relative p-4 space-y-4">
      <h2 className="text-2xl font-bold">Patient Data</h2>
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700">
          {error}
        </div>
      )}
      {loading && (<div className="flex justify-center items-center absolute inset-0 bg-white bg-opacity-50">
        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      </div>)}
      <div className="flex items-center gap-2 text-sm">
        <span>Show:</span>
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
          className="border px-2 py-1 rounded bg-white hover:bg-gray-50"
        >
          {[10, 20, 30, 40, 50].map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
          <option value="all">All</option>
        </select>
        <span>per page</span>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative inline-block column-dropdown">
          <button
            className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600 flex items-center gap-2"
            onClick={() => setShowColumnDropdown(prev => !prev)}
          >
            Visible Columns
          </button>
          {showColumnDropdown && (
            <div
              className="border p-4 space-y-4 bg-gray-100 rounded shadow-sm absolute mt-1 z-50"
              style={{ maxHeight: "200px", overflowY: "auto", width: "300px" }}
            >
              {/* Toggle All Checkbox */}
              <div className="flex items-center gap-4 p-2 bg-white rounded border shadow-sm">
                <input
                  type="checkbox"
                  id="toggle-all"
                  checked={visibleColumns.length === columns.length}
                  onChange={e => toggleAllColumns(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="toggle-all"
                  className="text-sm text-gray-700 break-words"
                >
                  Show All
                </label>
              </div>

              {/* Individual Column Checkboxes */}
              {columns.map(column => (
                <div
                  key={column.key}
                  className="flex items-center gap-4 p-2 bg-white rounded border shadow-sm hover:bg-gray-100"
                  style={{ maxWidth: "100%" }}
                >
                  <input
                    type="checkbox"
                    id={`toggle-${column.key}`}
                    checked={visibleColumns.includes(column.key)}
                    onChange={() => toggleColumn(column.key)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`toggle-${column.key}`}
                    className="text-sm text-gray-700 break-words"
                    style={{ maxWidth: "calc(100% - 2rem)" }} // Adjusts width to account for checkbox
                  >
                    {column.label}
                  </label>
                </div>
              ))}
            </div>
          )}


        </div>
        <button
          className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600 flex items-center gap-2"
          onClick={removeAllFilters}
        >
          Remove All Filters
        </button>
        <button
          className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600 flex items-center gap-2"
          onClick={exportVisibleDataAsCSV}
        >
          Export Visible Data (as CSV)
        </button>
        <button
          className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600 flex items-center gap-2"
          onClick={() => setShowAdditionalFilters(prev => !prev)}
        >
          Filter Columns
        </button>
      </div>
      {/* NAfsika Changes /*}
      {/* {showAdditionalFilters && (
        <div className="border p-4 space-y-2 bg-gray-50">
          <div className="flex flex-col space-y-2">
            {additionalFilters.map((af, i) => (
              <div key={i} className="flex items-center gap-2 flex-wrap">
                <select
                  className="border text-sm"
                  value={af.columnKey}
                  onChange={e =>
                    updateAdditionalFilter(i, "columnKey", e.target.value)
                  }
                >
                  <option value="">Select column</option>
                  {columns.map(col => (
                    <option key={col.key} value={col.key}>
                      {col.label}
                    </option>
                  ))}
                </select>
                <select
                  className="border text-sm"
                  value={af.type}
                  onChange={e =>
                    updateAdditionalFilter(i, "type", e.target.value)
                  }
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
                  className="border text-sm"
                  type="text"
                  placeholder="Value"
                  value={af.value}
                  onChange={e =>
                    updateAdditionalFilter(i, "value", e.target.value)
                  }
                />
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    className="mr-1"
                    checked={af.notNull}
                    onChange={e =>
                      updateAdditionalFilter(i, "notNull", e.target.checked)
                    }
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
              className="px-4 py-1 border bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600 text-sm rounded"
              onClick={addAdditionalFilter}
            >
              Add Additional Filter
            </button>
          </div>
        </div>
      )} */}
      {showAdditionalFilters && (
        <div className="border p-4 space-y-4 bg-gray-100 rounded shadow-sm">
          <div className="flex flex-col space-y-4">
            {additionalFilters.map((af, i) => (
              <div
                key={i}
                className="flex items-center gap-4 flex-wrap p-2 bg-white rounded border shadow-sm"
              >
                {/* Select column */}
                <select
                  className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600 border text-sm"
                  value={af.columnKey}
                  onChange={e =>
                    updateAdditionalFilter(i, "columnKey", e.target.value)
                  }
                >
                  <option value="" className="text-gray-800">Select column</option>
                  {columns.map(col => (
                    <option key={col.key} value={col.key} className="text-gray-700">
                      {col.label}
                    </option>
                  ))}
                </select>

                {/* Filter type */}
                <select
                  className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600 border text-sm"
                  value={af.type}
                  onChange={e =>
                    updateAdditionalFilter(i, "type", e.target.value)
                  }
                >
                  <option value="" className="text-gray-800">No filter</option>
                  {af.columnKey && isNumericColumn(af.columnKey) ? (
                    <>
                      <option value="equals" className="text-gray-700">Equals</option>
                      <option value="greater" className="text-gray-700">Greater than</option>
                      <option value="less" className="text-gray-700">Less than</option>
                      <option value="greaterEqual" className="text-gray-700">Greater or equal</option>
                      <option value="lessEqual" className="text-gray-700">Less or equal</option>
                    </>
                  ) : (
                    <>
                      <option value="equals" className="text-gray-700">Equals</option>
                      <option value="contains" className="text-gray-700">Contains</option>
                      <option value="starts" className="text-gray-700">Starts with</option>
                      <option value="ends" className="text-gray-700"> Ends with</option>
                    </>
                  )}
                </select>

                {/* Input for value */}
                <input
                  className="px-4 py-2 rounded border bg-gray-50 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                  type="text"
                  placeholder="Value"
                  value={af.value}
                  onChange={e =>
                    updateAdditionalFilter(i, "value", e.target.value.trim())
                  }
                />

                {/* Checkbox for Not Null */}
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={af.notNull}
                    onChange={e =>
                      updateAdditionalFilter(i, "notNull", e.target.checked)
                    }
                  />
                  Not Null
                </label>

                {/* Remove button */}
                <button
                  className="text-red-500 text-sm hover:underline"
                  onClick={() => removeAdditionalFilter(i)}
                >
                  Remove
                </button>
              </div>
            ))}

            {/* Add Additional Filter button */}
            <button
              className="px-4 py-2 mx-auto border bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600 text-sm rounded"
              onClick={addAdditionalFilter}
            >
              Add Additional Filter
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto relative">
        <table class="min-w-full bg-white border border-gray-300 table-auto shadow-md">
          <thead>
            <tr>
              {visibleColumns.map(colKey => {
                const column = columns.find(c => c.key === colKey)
                const colFilters = filters[colKey] || {
                  type: "",
                  value: "",
                  notNull: false
                }
                const uniqueValues = getUniqueValues(colKey)

                return (
                  <th
                    key={colKey}
                    className="p-3 border-b text-center whitespace-nowrap"
                    style={{
                      verticalAlign: "middle"
                    }}
                  >
                    <div className="flex flex-col space-y-1 items-center">
                      <div className="font-semibold text-sm">
                        {Constants.capitalizeFirstLetterOfEachWord(
                          column.label
                        )}
                        <br />
                      </div>
                      {/* {renderFilterTypeDropdown(colKey, colFilters)} */}
                      {/* <input
                        type="text"
                        value={colFilters.value}
                        onChange={e =>
                          handleFilterChange(
                            colKey,
                            colFilters.type,
                            e.target.value
                          )
                        }
                        className="w-full text-sm border"
                        placeholder="Filter value"
                        style={{ boxSizing: "border-box" }}
                      />
                      {renderValueDropdown(colKey, colFilters, uniqueValues)}
                      <label className="flex items-center text-sm justify-center">
                        <input
                          type="checkbox"
                          className="mr-1"
                          checked={colFilters.notNull}
                          onChange={e =>
                            handleNotNullChange(colKey, e.target.checked)
                          }
                        />
                        Not Null
                      </label> */}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`cursor-pointer transition-opacity ${rowIndex % 2 === 0 ? "bg-gray-100" : "bg-white"
                  } hover:opacity-80`}
                onClick={() => handleRowClick(row["icgc_donor_id"])}
                onMouseEnter={e => handleRowMouseEnter(e, row)}
                onMouseLeave={handleRowMouseLeave}
              >
                {visibleColumns.map(colKey => (
                  <td
                    key={colKey}
                    className="p-3 border text-center whitespace-nowrap"
                    style={{
                      verticalAlign: "middle"
                    }}
                  >
                    {row[colKey] === null ? "Null" : String(row[colKey]) || "-"}
                  </td>
                ))}
              </tr>
            ))}
            {!paginatedData && !loading && (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="p-2 text-center text-gray-500"
                >
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={goToPreviousPage}
            disabled={safeCurrentPage === 0}
            className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
          >
            Previous
          </button>
          <button
            onClick={goToNextPage}
            disabled={safeCurrentPage === totalPages - 1 || totalPages === 0}
            className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
          >
            Next
          </button>
        </div>
        <div className="text-sm">
          Page {safeCurrentPage + 1} of {totalPages || 1}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="border px-2 py-1 rounded bg-white hover:bg-gray-50"
          >
            {[10, 20, 30, 40, 50].map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
            <option value="all">All</option>
          </select>
          <span>per page</span>
        </div>
      </div>

      {hoveredRowInfo && hoveredRowInfo.info && (
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
  )
}

export default PatientData
