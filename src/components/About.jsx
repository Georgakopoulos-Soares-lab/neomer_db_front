import React from "react"

const About = () => {
  return (
    <div className="flex flex-col items-center p-8 bg-gray-50 min-h-screen">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-center mb-4">About Neomer Data</h2>
        <p className="text-gray-700 text-center mb-6">
          NeomerDB is the first database dedicated to cancer biomarkers using k-mers.
          Nullomers  are  short  k-mers  which  are  absent  from  a  human  genome.
          Neomers are short DNA and RNA nullomers, which are normally absent from
          during cancer development.
        </p>
        <p className="text-gray-700 text-center mb-6">
          NenomerDB encompasses the set of neomers associated with each cancer type and organ
          derived from 10,000 Whole Exome Sequencing and 2,775 Whole Genome Sequencing tumor-
          matched   samples.  By incorporating germline data from over 76,000 whole
          genomes and 730,000 exomes of diverse ancestries, we have rigorously
          filtered out neomers likely to arise from germline variants, ensuring precision
          and reliability.
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          The database includes different filtering options, such as:
          <li className="text-gray-700">Selection of pan-cancer neomers or neomers associated with specific
            cancer types or organs.</li>
          <li className="text-gray-700">Filtering by tumor stage and recurrence threshold.</li>
          <li className="text-gray-700">Advanced germline variant filtering across different ancestries.</li>
        </ul>
      </div>
    </div>
  )
}

export default About
