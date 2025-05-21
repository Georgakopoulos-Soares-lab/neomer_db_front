import React from "react"
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import Navbar from "./components/Navbar"
import PatientData from "./components/PatientData"
import ExomesPatientData from "./components/ExomesPatientData"
import Neomers from "./components/Neomers"
import About from "./components/About"
import DownloadDataset from "./components/DownloadDataset"
import PatientDetails from "./components/PatientDetails"
import ExomesPatientDetails from "./components/ExomesPatientDetails"
import Visualizations from "./components/Visualizations"
import Exomes from "./components/Exomes"
import Homepage from "./components/Homepage"
import Privacy from "./components/Privacy"


const App = () => {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Navbar />
        <div className="flex-1 p-10 overflow-auto">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/patient_data" element={<PatientData />} />
            <Route path="/exomes_patient_data" element={<ExomesPatientData />} />
            <Route path="/about" element={<About />} />
            <Route path="/download" element={<DownloadDataset />} />
            <Route path="/patient/:donorId" element={<PatientDetails />} />
            <Route path="/exomes_patient/:donorId" element={<ExomesPatientDetails />} />
            
            <Route path="/visualizations" element={<Visualizations />} />
            <Route path="/exomes" element={<Exomes />} />
            <Route path="/genomes" element={<Neomers />} />
            <Route path="/privacy" element={<Privacy />} />

          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
