import React, { useCallback } from "react";

const DownloadDataset = () => {

  const handleDownload = useCallback(() => [
    console.log("Download to be implemented...")
  ], [])

  return (
    <div className="flex flex-col items-center p-8 bg-gray-50 min-h-screen">
      <div className="bg-white p-12 rounded shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-center mb-4">Downloads</h2>
        <p className="text-gray-700 text-center mb-6">
          Here you can download all the dataset.
        </p>
        <p className="text-gray-700 text-center mb-6">
          Choose a format to download the Neomer Data:
        </p>
        <div className="grid grid-cols-1 gap-6">
          <button
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
            onClick={() => handleDownload("CSV")}
          >
            Download as CSV
          </button>
          <button
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
            onClick={() => handleDownload("JSON")}
          >
            Download as JSON
          </button>
          <button
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
            onClick={() => handleDownload("PARQUET")}
          >
            Download as PARQUET
          </button>
          <button
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
            onClick={() => handleDownload("BED")}
          >
            Download as BED
          </button>
        </div>
      </div >
    </div >
  )
}

export default DownloadDataset
