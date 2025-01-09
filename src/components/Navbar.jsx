import React, { useState } from "react"
import { NavLink } from "react-router-dom"
import { FaBars, FaTimes } from "react-icons/fa"

const Navbar = () => {
  const [isExpanded, setIsExpanded] = useState(true)

  const navItems = [
    { path: "/", label: "Neomers" },
    { path: "/patient_data", label: "Patient Data" },
    { path: "/visualizations", label: "Visualizations" },
    { path: "/about", label: "About" },
    { path: "/download", label: "Download Dataset" }

  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`absolute top-4 -right-4 z-50 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-colors ${
          isExpanded ? "transform rotate-0" : "transform rotate-180"
        }`}
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isExpanded ? <FaTimes size={16} /> : <FaBars size={16} />}
      </button>
      <nav
        className={`bg-white shadow-lg h-screen transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? "w-128" : "w-0"
        }`}
      >
        <div
          className={`transition-all duration-300 ${
            isExpanded ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="p-5">
            <h1 className="text-2xl font-bold text-gray-800 whitespace-nowrap">
              NeomerDB
            </h1>
          </div>
          <ul className="space-y-2">
            {navItems.map(item => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `block py-2 px-4 text-gray-700 hover:bg-gray-200 transition-colors whitespace-nowrap ${
                      isActive ? "bg-gray-200 font-semibold" : ""
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  )
}

export default Navbar
