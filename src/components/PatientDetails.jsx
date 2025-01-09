// PatientDetails.jsx
import React, { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import * as Constants from "../constants"

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

const PatientDetails = () => {
  const { donorId } = useParams()  // The donorId from the URL
  const [patientData, setPatientData] = useState(null)
  const [neomersData, setNeomersData] = useState([])
  const [patientLoading, setPatientLoading] = useState(false)
  const [neomersLoading, setNeomersLoading] = useState(false)
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analyzedNeomer , setAnalyzedNeomer] =  useState('(No Neomer Selected)')

  // Parameters for Neomer Table
  const [length, setLength] = useState(16)  // Default length is 16
  const [topN, setTopN] = useState(10)      // Default top_n is 10

  // Search Neomer Parameter
  const [searchNeomer, setSearchNeomer] = useState("")  // Search prefix
  const [debouncedSearchNeomer, setDebouncedSearchNeomer] = useState("")

  // Analyze Neomer Section (Real Data)
  const [analyzeData, setAnalyzeData] = useState({
    totalNeomers: 0,
    distinctDonors: 0,
    distinctCancerTypes: 0,
    distinctOrgans: 0
  })

  // Debounce the search input to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchNeomer(searchNeomer)
    }, 500) // 500ms debounce

    return () => {
      clearTimeout(handler)
    }
  }, [searchNeomer])

  // Fetch Patient Details when donorId changes
  useEffect(() => {
    if (donorId) {
      fetchPatientDetails(donorId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donorId]) // Only when donorId changes

  // Fetch Neomers when length, topN, or debouncedSearchNeomer changes
  useEffect(() => {
    if (donorId) {
      fetchPatientNeomers(donorId, length, topN, debouncedSearchNeomer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, topN, debouncedSearchNeomer]) // Only when length, topN, or search changes

  const fetchPatientDetails = async (id) => {
    try {
      setPatientLoading(true)
      setError(null)
      const endpoint = `${Constants.API_URL}/patient_details?donor_id=${id}`
      const resp = await axios.get(endpoint)

      // Suppose the endpoint returns data like:
      // {
      //   "patient": {
      //     "# donor_unique_id": "TCGA-AB-1234",
      //     "icgc_donor_id": "XYZ123",
      //     ...
      //     "Cancer_Type": "SomeCancerType",
      //     "Cancer_Organ": "SomeOrgan"
      //   }
      // }
      setPatientData(resp.data.patient)
      setPatientLoading(false)
    } catch (err) {
      setPatientLoading(false)
      setError("Failed to fetch patient details.")
      console.error(err)
    }
  }

  // Fetch Neomers with length, top_n, and searchNeomer parameters
  const fetchPatientNeomers = async (id, len, topNVal, searchPrefix) => {
    try {
      setNeomersLoading(true)
      setError(null)
      const params = {
        donor_id: id,
        length: len,
        top_n: topNVal
      }
      if (searchPrefix.trim() !== "") {
        params.prefix = searchPrefix.trim()
      }
      const endpoint = `${Constants.API_URL}/patient_neomers`
      const resp = await axios.get(endpoint, { params })
      // Suppose it returns data like:
      // {
      //   "neomers": [
      //     { "neomer": "ABC", "count": 10 },
      //     { "neomer": "GTT", "count": 5 },
      //     ...
      //   ]
      // }
      setNeomersData(resp.data.neomers || [])
      setNeomersLoading(false)

      // Reset Analyze Neomer Section when fetching new data
      setAnalyzeData({
        totalNeomers: 0,
        distinctDonors: 0,
        distinctCancerTypes: 0,
        distinctOrgans: 0
      })
      setAnalyzedNeomer('(No Neomer Selected)')
    } catch (err) {
      setNeomersLoading(false)
      setError("Failed to fetch neomers data.")
      console.error(err)
    }
  }

  // Handle Length Change
  const handleLengthChange = (e) => {
    const selectedLength = parseInt(e.target.value, 10)
    if (selectedLength >= 11 && selectedLength <= 20) {
      setLength(selectedLength)
    }
  }

  // Handle Top N Change
  const handleTopNChange = (e) => {
    const value = parseInt(e.target.value, 10)
    if (value > 0) {
      setTopN(value)
    }
  }

  // Handle Search Neomer Change
  const handleSearchNeomerChange = (e) => {
    setSearchNeomer(e.target.value)
  }

  // Handle Neomer Click
  const handleNeomerClick = async (neomer) => {
    try {
      setAnalyzedNeomer(neomer)
      setAnalyzeLoading(true)
      setError(null)
      const endpoint = `${Constants.API_URL}/analyze_neomer?neomer=${encodeURIComponent(neomer)}`
      const resp = await axios.get(endpoint)
      // Expected response:
      // {
      //   "analysis": {
      //     "totalNeomers": 100,
      //     "distinctDonors": 20,
      //     "distinctCancerTypes": 5,
      //     "distinctOrgans": 3
      //   }
      // }
      setAnalyzeData(resp.data.analysis)
      setAnalyzeLoading(false)
    } catch (err) {
      setAnalyzeLoading(false)
      setError("Failed to analyze neomer.")
      console.error(err)
    }
  }

  if (patientLoading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin h-12 w-12 text-blue-500">
          <svg
            className="h-full w-full"
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
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen">
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {!patientData && (
        <div className="p-4 bg-white shadow rounded">
          <p className="text-gray-700">No patient data found.</p>
          <Link to="/" className="underline text-blue-600">
            Go Back
          </Link>
        </div>
      )}

      {patientData && (
        <>
          <h2 className="text-3xl font-bold text-center">Patient Details</h2>

          {/* Patient Info Card */}
          <div className="p-6 bg-white border border-gray-200 shadow-md rounded-lg">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleColumnKeys.map((key) => {
                if (key in patientData) {
                  const value = patientData[key]
                  if (value == null || value === 'Null') return null
                  return (
                    <div key={key} className="flex flex-col">
                      <span className="font-medium text-gray-600">
                        {Constants.capitalizeFirstLetterOfEachWord(key)}:
                      </span>
                      <span className="text-gray-800">
                        {String(value)}
                      </span>
                    </div>
                  )
                }
                return null
              })}
            </div>
          </div>

          {/* Cancer Type & Organ Card */}
          <div className="p-6 bg-white border border-gray-200 shadow-md rounded-lg">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">Cancer Information</h3>
            <div className="flex flex-col md:flex-row gap-6">
              <div>
                <span className="font-medium text-gray-600">Cancer Type: </span>
                <span className="text-gray-800">{patientData["Cancer_Type"] || "N/A"}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Cancer Organ: </span>
                <span className="text-gray-800">{patientData["Cancer_Organ"] || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Neomers and Analyze Neomer Section */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Neomers Table Card (Left) */}
            <div className="md:w-2/3 p-6 bg-white border border-gray-200 shadow-md rounded-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-800">Patient Neomers</h3>

              {/* Parameters for Neomers */}
              <div className="flex flex-col md:flex-row gap-6 mb-4">
                {/* Length Selector */}
                <div className="flex flex-col">
                  <label className="font-medium text-gray-600 mb-1">Neomer Length:</label>
                  <select
                    value={length}
                    onChange={handleLengthChange}
                    className="border border-gray-300 px-3 py-2 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 10 }, (_, i) => 11 + i).map((len) => (
                      <option key={len} value={len}>
                        {len}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Top N Input */}
                <div className="flex flex-col">
                  <label className="font-medium text-gray-600 mb-1">Top N:</label>
                  <input
                    type="number"
                    value={topN}
                    min={1}
                    onChange={handleTopNChange}
                    className="border border-gray-300 px-3 py-2 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
                    placeholder="10"
                  />
                </div>
              </div>

              {/* Search Neomer Text Box */}
              <div className="flex flex-col mb-4">
                <label className="font-medium text-gray-600 mb-1">Search Neomer:</label>
                <input
                  type="text"
                  value={searchNeomer}
                  onChange={handleSearchNeomerChange}
                  className="border border-gray-300 px-3 py-2 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter neomer prefix"
                />
              </div>

              {/* Loader Above Neomers Table */}
              {neomersLoading && (
                <div className="flex justify-center my-4">
                  <div className="animate-spin h-6 w-6 text-blue-500">
                    <svg
                      className="h-full w-full"
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
                </div>
              )}

              {/* Neomers Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 table-auto shadow-md">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3 border-b text-center text-left text-gray-700">Neomer</th>
                      <th className="p-3 border-b text-center text-right text-gray-700">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!neomersLoading && neomersData.length === 0 && (
                      <tr>
                        <td colSpan={2} className="p-4 text-center text-gray-600">
                          No neomers found.
                        </td>
                      </tr>
                    )}
                    {neomersData.map((item, idx) => (
                      <tr
                        key={idx}
                        className={`cursor-pointer ${
                          idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                        } hover:bg-blue-50`}
                        title="Analyze Neomer"
                        onClick={() => handleNeomerClick(item.neomer)}
                      >
                        <td className="p-3 border-b text-center text-left text-gray-800">{item.neomer}</td>
                        <td className="p-3 border-b text-center text-right text-gray-800">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Analyze Neomer Section (Right) */}
            <div className="md:w-1/3 p-6 bg-white border border-gray-200 shadow-md rounded-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-800">Analyze Neomer {analyzedNeomer}</h3>

              {/* Loader in Analyze Section */}
              {analyzeLoading ? (
                <div className="flex justify-center my-4">
                  <div className="animate-spin h-6 w-6 text-blue-500">
                    <svg
                      className="h-full w-full"
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
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Total Neomer Count:</span>
                    <span className="text-gray-800">{analyzeData.totalNeomers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Found in Distinct Donors:</span>
                    <span className="text-gray-800">{analyzeData.distinctDonors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Found in Cancer Types:</span>
                    <span className="text-gray-800">{analyzeData.distinctCancerTypes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Found in Organs:</span>
                    <span className="text-gray-800">{analyzeData.distinctOrgans}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default PatientDetails
