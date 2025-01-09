// Visualizations.jsx
import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import * as Constants from "../constants";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "chartjs-chart-matrix";

// Import and register the Matrix controller from chartjs-chart-matrix
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";

ChartJS.register(
  MatrixController,
  MatrixElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale
);

// Helper function to generate a blueish color based on log Jaccard index
const getColorForLogJaccard = (logJaccard) => {
  // Define a color scale from light blue to dark blue
  // logJaccard ranges from log(epsilon) ~ -13.8155 to log(1) = 0
  // Normalize logJaccard to [0, 1] for color scaling
  const epsilon = 1e-6;
  const normalized = (logJaccard - Math.log(epsilon)) / (0 - Math.log(epsilon));
  // Clamp between 0 and 1
  const clamped = Math.min(Math.max(normalized, 0), 1);
  // Use HSL: 200 (blue) to 240 (dark blue)
  const hue = 200 + (240 - 200) * clamped;
  const saturation = 100; // Full saturation
  const lightness = 50; // Medium lightness
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const Visualizations = () => {
  // State variables
  const [K] = useState(15); // Fixed K value to 15
  const [jaccardData, setJaccardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Jaccard indices from the backend automatically on component mount
  useEffect(() => {
    fetchJaccardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs once on mount

  // Fetch Jaccard indices from the backend
  const fetchJaccardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${Constants.API_URL}/jaccard_index`, {
        params: { K },
      });
      setJaccardData(response.data.jaccard_indices);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching Jaccard indices:", err);
      setError("Failed to fetch Jaccard indices.");
      setLoading(false);
    }
  };

  // Prepare data for the heatmap using useMemo to avoid unnecessary recalculations
  const heatmapData = useMemo(() => {
    if (!jaccardData.length) return null;

    // 1. Collect all unique cancer types from both a and b
    const allCancerTypes = new Set();
    jaccardData.forEach((item) => {
      allCancerTypes.add(item.cancer_type_a);
      allCancerTypes.add(item.cancer_type_b);
    });

    // Convert set to an array; sort alphabetically
    const cancerTypes = Array.from(allCancerTypes).sort();

    // 2. Create a map for easy lookup
    const dataMap = {};
    jaccardData.forEach((item) => {
      const key = `${item.cancer_type_a}|${item.cancer_type_b}`;
      dataMap[key] = item;
    });

    // 3. Generate all possible pairs
    const dataPoints = [];
    cancerTypes.forEach((typeA) => {
      cancerTypes.forEach((typeB) => {
        const key = `${typeA}|${typeB}`;
        const item = dataMap[key];
        if (item) {
          const logJaccard = Math.log(item.jaccard_index + 1e-6); // Adding epsilon to avoid log(0)
          dataPoints.push({
            x: typeA,
            y: typeB,
            v: logJaccard,
            jaccard_index: item.jaccard_index,
            backgroundColor: getColorForLogJaccard(logJaccard),
          });
        } else {
          // If pair is missing, assign default values
          const logJaccard = Math.log(1e-6); // log(epsilon)
          dataPoints.push({
            x: typeA,
            y: typeB,
            v: logJaccard,
            jaccard_index: 0,
            backgroundColor: getColorForLogJaccard(logJaccard), // Light blue for missing data
          });
        }
      });
    });

    return {
      labels: cancerTypes, // Used for both x & y axes
      datasets: [
        {
          // label: "Jaccard Similarity of Cancer Types on Neomers",
          data: dataPoints,
          backgroundColor: dataPoints.map((pt) => pt.backgroundColor),
          borderWidth: 1,
          width: 30, // Equal width and height for square tiles
          height: 30,
        },
      ],
    };
  }, [jaccardData]);

  // Configuration options for the heatmap using useMemo
  const options = useMemo(() => {
    if (!heatmapData) return {};

    return {
      responsive: true,
      maintainAspectRatio: false, // Allow the chart to resize properly
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const raw = context.raw;
              const xLabel = raw.x;
              const yLabel = raw.y;
              if (raw.jaccard_index === 0) {
                return [`${xLabel} & ${yLabel}`, `Jaccard Similarity: 0.000`];
              }
              const logJaccard = raw.v;
              return [
                `${xLabel} & ${yLabel}`,
                `Jaccard Similarity: ${raw.jaccard_index.toFixed(3)}`,
                `Log(Jaccard): ${logJaccard.toFixed(3)}`,
              ];
            },
          },
        },
        legend: {
          display: false, // Hide the default legend
        },
        title: {
          display: true,
          // text: "Jaccard Similarity of Cancer Types on Neomers",
          font: {
            size: 20, // Larger font size for the title
            weight: 'bold',
          },
          color: '#000', // Black color for the title
        },
      },
      scales: {
        x: {
          type: "category",
          labels: heatmapData.labels,
          ticks: {
            autoSkip: false,
            maxRotation: 90,
            minRotation: 90,
            font: {
              size: 10, // Reduced font size for axis labels
              weight: 'bold',
              color: '#000', // Black color for axis labels
            },
          },
          grid: {
            display: false,
          },
          title: {
            display: true,
            // text: "Cancer Type A",
            font: {
              size: 16, // Larger font size for axis title
              weight: 'bold',
              color: '#000', // Black color for axis title
            },
            color: '#000',
          },
        },
        y: {
          type: "category",
          labels: heatmapData.labels,
          reverse: true, // Reverse the y-axis to have the first label at the top
          ticks: {
            autoSkip: false,
            font: {
              size: 12, // Maintained font size for y-axis labels
              weight: 'bold',
              color: '#000', // Black color for y-axis labels
            },
          },
          grid: {
            display: false,
          },
          title: {
            display: true,
            // text: "Cancer Type B",
            font: {
              size: 16, // Larger font size for axis title
              weight: 'bold',
              color: '#000', // Black color for axis title
            },
            color: '#000',
          },
        },
      },
    };
  }, [heatmapData]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold text-center mb-6">Visualizations</h2>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-semibold mb-4 text-black">
          Jaccard Similarity of Cancer Types on Neomers
        </h3>

        {/* Automatically fetch Jaccard data; no input or button required */}
        {/* Optionally display the fixed K value */}
        {/* <p className="text-lg mb-4 text-black">Analyzing with K = {K}</p> */}

        {loading && (
          <div className="flex justify-center my-4">
            <div className="animate-spin h-8 w-8 text-blue-500">
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

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
            {error}
          </div>
        )}

        {!loading && !error && jaccardData.length === 0 && (
          <p className="text-lg text-black">No Jaccard data available.</p>
        )}

        {!loading && jaccardData.length > 0 && heatmapData && (
          <div className="relative" style={{ height: '700px' }}>
            <Chart
              type="matrix"
              data={heatmapData}
              options={options}
              // Add a unique key to force re-render when data changes
              key={JSON.stringify(heatmapData)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Visualizations;
