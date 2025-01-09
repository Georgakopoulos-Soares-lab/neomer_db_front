import React from "react"
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import Navbar from "./components/Navbar"
import PatientData from "./components/PatientData"
import Neomers from "./components/Neomers"
import About from "./components/About"
import DownloadDataset from "./components/DownloadDataset"
import PatientDetails from "./components/PatientDetails"
import Visualizations from "./components/Visualizations"



const App = () => {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Navbar />
        <div className="flex-1 p-10 overflow-auto">
          <Routes>
            <Route path="/" element={<Neomers/>} />
            <Route path="/patient_data" element={<PatientData />} />
            <Route path="/about" element={<About />} />
            <Route path="/download" element={<DownloadDataset />} />
            <Route path="/patient/:donorId" element={<PatientDetails />} /> 
            <Route path="/visualizations" element={<Visualizations />} /> 

          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
