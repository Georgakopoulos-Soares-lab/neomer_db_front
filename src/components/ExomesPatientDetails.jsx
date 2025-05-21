// ExomePatientDetails.jsx
import React, { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import * as Constants from "../constants"
import Loader from "./Loader"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js"
import { Doughnut } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip, Legend)

const visibleColumnKeys = [
  "bcr_patient_uuid",
  "bcr_patient_barcode",
  "gender",
  "vital_status",
  "days_to_birth",
  "days_to_death",
  "days_to_last_followup",
  "days_to_initial_pathologic_diagnosis",
  "age_at_initial_pathologic_diagnosis",
  "icd_10",
  "tissue_retrospective_collection_indicator",
  "tissue_prospective_collection_indicator",
  "history_of_neoadjuvant_treatment",
  "tumor_tissue_site",
  "new_tumor_event_after_initial_treatment",
  "radiation_therapy",
  "race",
  "project_code",
  "prior_dx",
  "ethnicity",
  "person_neoplasm_cancer_status",
  "year_of_initial_pathologic_diagnosis",
  "pathologic_T",
  "pathologic_M",
  "pathologic_N",
  "pathologic_stage",
  "clinical_stage",
  "clinical_T",
  "clinical_N",
  "extranodal_involvement",
  "additional_radiation_therapy",
  "external_beam_radiation_therapy_administered_paraaortic_region_lymph_node_dose"
]

const HIDE_VALUES = new Set([
  "[Not Applicable]",
  "[Not Available]",
  "[Not Evaluated]",
  "[Unknown]"
])

// Utility: generate HSL colors
const makeColor = i => `hsl(${(i * 360) / 10}, 70%, 60%)`

export default function ExomePatientDetails() {
  const { donorId } = useParams()
  const [patientData, setPatientData] = useState(null)
  const [neomersData, setNeomersData] = useState([])
  const [patientLoading, setPatientLoading] = useState(false)
  const [neomersLoading, setNeomersLoading] = useState(false)
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [error, setError] = useState(null)

  const [length, setLength] = useState(11)
  const [topN, setTopN] = useState(10)
  const [searchNeomer, setSearchNeomer] = useState("")
  const [debouncedSearchNeomer, setDebouncedSearchNeomer] = useState("")

  const [analyzedNeomer, setAnalyzedNeomer] = useState("(No Neomer Selected)")
  const [analysis, setAnalysis] = useState({
    cancerBreakdown: [],
    organBreakdown: []
  })

  // Debounce
  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearchNeomer(searchNeomer.trim()), 500)
    return () => clearTimeout(h)
  }, [searchNeomer])

  // Fetch patient details
  useEffect(() => {
    if (!donorId) return
    ;(async () => {
      try {
        setPatientLoading(true)
        setError(null)
        const { data } = await axios.get(
          `${Constants.API_URL}/exome_patient_details`,
          { params: { donor_id: donorId } }
        )
        setPatientData(data.patient)
      } catch (err) {
        console.error(err)
        setError("Failed to fetch patient details.")
      } finally {
        setPatientLoading(false)
      }
    })()
  }, [donorId])

  // Fetch neomers
  useEffect(() => {
    if (!donorId) return
    ;(async () => {
      try {
        setNeomersLoading(true)
        setError(null)
        const params = { donor_id: donorId, length, top_n: topN }
        if (debouncedSearchNeomer) params.prefix = debouncedSearchNeomer
        const { data } = await axios.get(
          `${Constants.API_URL}/exome_patient_neomers`,
          { params }
        )
        setNeomersData(data.neomers || [])
        setAnalyzedNeomer("(No Neomer Selected)")
        setAnalysis({ cancerBreakdown: [], organBreakdown: [] })
      } catch (err) {
        console.error(err)
        setError("Failed to fetch neomers.")
      } finally {
        setNeomersLoading(false)
      }
    })()
  }, [donorId, length, topN, debouncedSearchNeomer])

  // Analyze
  const handleNeomerClick = async (neomer) => {
    try {
      setAnalyzedNeomer(neomer)
      setAnalyzeLoading(true)
      setError(null)
      const { data } = await axios.get(
        `${Constants.API_URL}/exome_analyze_neomer`,
        { params: { neomer } }
      )
      setAnalysis(data.analysis)
    } catch (err) {
      console.error(err)
      setError("Failed to analyze neomer.")
    } finally {
      setAnalyzeLoading(false)
    }
  }

  // Build Chart.js data for multi-level doughnut
  const buildChartData = () => {
    const { cancerBreakdown, organBreakdown } = analysis
    // outer labels & data
    const outerLabels = cancerBreakdown.map(x => x.cancerType)
    const outerData = cancerBreakdown.map(x => x.count)
    const outerColors = outerLabels.map((_, i) => makeColor(i))
    // inner labels & data
    const innerLabels = organBreakdown.map(x => x.organ)
    const innerData = organBreakdown.map(x => x.count)
    const innerColors = innerLabels.map((_, i) => makeColor(i + outerLabels.length))

    return {
      labels: [...outerLabels, ...innerLabels],
      datasets: [
        {
          label: "Cancer Types",
          data: outerData,
          backgroundColor: outerColors,
          radius: "100%",
          cutout: "60%"
        },
        {
          label: "Organs",
          data: innerData,
          backgroundColor: innerColors,
          radius: "60%",
          cutout: "30%"
        }
      ]
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      tooltip: { mode: "index" }
    }
  }

  if (patientLoading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-screen bg-gray-100">
        <Loader />
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

      {!patientData ? (
        <div className="p-4 bg-white shadow rounded">
          <p className="text-gray-700">No patient data found.</p>
          <Link to="/" className="underline text-blue-600">Go Back</Link>
        </div>
      ) : (
        <>
          <h2 className="text-3xl font-bold text-center">Patient Details</h2>

          {/* Basic Info */}
          <div className="p-6 bg-white border border-gray-200 shadow-md rounded-lg">
            <h3 className="text-2xl font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleColumnKeys.map(key => {
                const v = patientData[key]
                if (!v || HIDE_VALUES.has(v)) return null
                return (
                  <div key={key}>
                    <span className="font-medium text-gray-600">
                      {Constants.capitalizeFirstLetterOfEachWord(key)}:
                    </span>{" "}
                    <span className="text-gray-800">{v}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cancer & Organ */}
          <div className="p-6 bg-white border border-gray-200 shadow-md rounded-lg">
            <h3 className="text-2xl font-semibold mb-4">Cancer Information</h3>
            <div className="flex flex-col md:flex-row gap-6">
              {["Cancer_Type","Organ"].map(fld => {
                const v = patientData[fld]
                if (!v || HIDE_VALUES.has(v)) return null
                return (
                  <div key={fld}>
                    <span className="font-medium text-gray-600">
                      {fld.replace("_"," ")}:
                    </span>{" "}
                    <span className="text-gray-800">{v}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* two-column layout for table + chart */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Neomers Table */}
            <div className="md:w-1/2 p-6 bg-white border border-gray-200 shadow-md rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">Exome Neomers</h3>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div>
                  <label className="block font-medium mb-1">Length</label>
                  <select
                    value={length}
                    onChange={e => setLength(+e.target.value)}
                    className="border px-2 py-1 rounded"
                  >
                    {Array.from({ length: 7 }, (_, i) => 11 + i).map(l => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Top N</label>
                  <input
                    type="number"
                    min="1"
                    value={topN}
                    onChange={e=>setTopN(+e.target.value)}
                    className="border px-2 py-1 rounded w-20"
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-medium mb-1">Prefix</label>
                  <input
                    type="text"
                    value={searchNeomer}
                    onChange={e=>setSearchNeomer(e.target.value)}
                    className="border px-2 py-1 rounded w-full"
                  />
                </div>
              </div>
              {neomersLoading ? (
                <Loader />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border table-auto">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Neomer</th>
                        <th className="p-2 text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {neomersData.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="p-2 text-center text-gray-600">
                            No neomers found.
                          </td>
                        </tr>
                      ) : neomersData.map((r,i)=>(
                        <tr
                          key={i}
                          className={i%2===0?"bg-gray-50":"bg-white"}
                          onClick={()=>handleNeomerClick(r.neomer)}
                          style={{cursor:"pointer"}}
                        >
                          <td className="p-2">{r.neomer}</td>
                          <td className="p-2 text-right">{r.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Multi-level Doughnut */}
            <div className="md:w-1/2 p-6 bg-white border border-gray-200 shadow-md rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">
                Analyze Neomer: {analyzedNeomer}
              </h3>
              {analyzeLoading ? (
                <Loader />
              ) : (
                <div style={{ height: 350 }}>
                  <Doughnut
                    data={buildChartData()}
                    options={chartOptions}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
