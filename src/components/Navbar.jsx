import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";

const Navbar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`absolute top-4 z-50 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-colors ${isExpanded ? "transform rotate-0 -right-4" : "transform rotate-180 left-3"
          }`}
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isExpanded ? <FaTimes size={16} /> : <FaBars size={16} />}
      </button>

      {/* Sidebar */}
      <nav
        className={`bg-white shadow-lg h-screen transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? "w-64" : "w-0"
          }`}
      >
        <div className={`transition-all duration-300 ${isExpanded ? "opacity-100" : "opacity-0"}`}>
          <NavLink className="p-5" to='/'>
            <h1 className="text-2xl font-bold text-gray-800 whitespace-nowrap px-5">NeomerDB</h1>
          </NavLink>

          <ul className="space-y-2">
            {/* Neomers Dropdown */}
            <li className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full text-left py-2 px-4 text-gray-700 hover:bg-gray-200 transition-colors flex justify-between items-center rounded-md"
              >
                Neomers
                <span>{isDropdownOpen ? "−" : "＋"}</span>
              </button>

              {/* Dropdown Menu */}
              <div
                className={`absolute left-0 w-full mt-1 bg-white shadow-lg rounded-md transition-all duration-300 overflow-hidden ${isDropdownOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                  }`}
              >
                <ul className="divide-y divide-gray-200">
                  <li>
                    <NavLink
                      to="/exomes"
                      className="block py-2 px-4 text-gray-700 hover:bg-gray-300 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Exomes
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/genomes"
                      className="block py-2 px-4 text-gray-700 hover:bg-gray-300 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Genomes
                    </NavLink>
                  </li>
                </ul>
              </div>
            </li>

            {/* Other Navigation Items */}
            <li>
              <NavLink
                to="/patient_data"
                className={({ isActive }) =>
                  `block py-2 px-4 text-gray-700 hover:bg-gray-200 transition-colors ${isActive ? "bg-gray-200 font-semibold" : ""
                  }`
                }
              >
                Patient Data
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/visualizations"
                className={({ isActive }) =>
                  `block py-2 px-4 text-gray-700 hover:bg-gray-200 transition-colors ${isActive ? "bg-gray-200 font-semibold" : ""
                  }`
                }
              >
                Visualizations
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `block py-2 px-4 text-gray-700 hover:bg-gray-200 transition-colors ${isActive ? "bg-gray-200 font-semibold" : ""
                  }`
                }
              >
                About
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/download"
                className={({ isActive }) =>
                  `block py-2 px-4 text-gray-700 hover:bg-gray-200 transition-colors ${isActive ? "bg-gray-200 font-semibold" : ""
                  }`
                }
              >
                Download Dataset
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
