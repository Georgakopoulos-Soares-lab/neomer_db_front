import React, { useState, useEffect } from "react"
import axios from "axios"
import * as Constants from "../constants"


const HomePage = () => {
    const [cancerTypes, setCancerTypes] = useState([])

    useEffect(() => {
        const fetchCancerTypes = async () => {
            const endpoint = Constants.API_URL + "/cancer_types"
            const response = await axios.get(endpoint)

            const fetchedData = response.data.data

            setCancerTypes(fetchedData);
        };

        fetchCancerTypes();
    }, []);

    return (
        <div className="p-6 space-y-6">
            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-800">Welcome to NeomerDB</h1>
            <p className="text-gray-600">
                NeomerDB is a specialized database for genomic and cancer-related research. It contains information on
                neomers, nullomers, exome sequences, and patient survival data.
            </p>

            {/* Cancer Types Table */}
            <div className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Cancer Types Overview</h2>
                <div className="bg-white shadow-md rounded-lg p-4">
                    <table className="w-full border-collapse border border-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border border-gray-300 p-2 text-left">Cancer Type</th>
                                <th className="border border-gray-300 p-2 text-left">Acronym</th>
                                <th className="border border-gray-300 p-2 text-left">Organ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cancerTypes?.map((type, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 p-2">{type[0]}</td>
                                    <td className="border border-gray-300 p-2">{type[1]}</td>
                                    <td className="border border-gray-300 p-2">{type[3]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
export default HomePage