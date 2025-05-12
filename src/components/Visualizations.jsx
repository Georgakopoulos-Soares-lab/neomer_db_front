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
    ArcElement,
} from "chart.js";
import { Chart, Doughnut } from "react-chartjs-2";
import "chartjs-plugin-zoom";  // Import the chartjs zoom plugin
import Loader from './Loader';
import "chartjs-chart-matrix";
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";

ChartJS.register(
    MatrixController,
    MatrixElement,
    Tooltip,
    Legend,
    Title,
    CategoryScale,
    LinearScale,
    ArcElement
);

const getColorForLogJaccard = (logJaccard) => {
    const epsilon = 1e-6;
    const normalized = (logJaccard - Math.log(epsilon)) / (0 - Math.log(epsilon));
    const clamped = Math.min(Math.max(normalized, 0), 1);

    // Gradient from Red -> Yellow -> Green
    const r = Math.round(255 * (1 - clamped));  // Red decreases as similarity increases
    const g = Math.round(255 * clamped);        // Green increases with similarity
    const b = 50;  // Keep blue constant for a warm contrast

    return `rgb(${r}, ${g}, ${b})`;
};


const COLORS = [
    "#8884d8", "#8dd1e1", "#82ca9d", "#a4de6c", "#d0ed57", "#ffc658",
    "#ff8042", "#00C49F", "#FFBB28", "#FF8042", "#5A4DC1", "#63b8d0",
    "#5DA772", "#84c247", "#b4d147", "#e5a639", "#e56730", "#00807D",
    "#D89B1F", "#E5734F"
];

const Visualizations = () => {
    const [K] = useState(13);
    const [jaccardData, setJaccardData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingDoughnut, setLoadingDoughnut] = useState(false);
    const [error, setError] = useState(null);
    const [errorDoughnut, setErrorDoughnut] = useState(null);
    const [lengthCancerStats, setLengthCancerStats] = useState([]);

    useEffect(() => {
        fetchJaccardData();
        fetchLengthCancerStats();
    }, []);

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

    const fetchLengthCancerStats = async () => {
        try {
            setLoadingDoughnut(true);
            setErrorDoughnut(null);
            setLengthCancerStats(Constants.multi_doughnut_cached_data)
            setLoadingDoughnut(false);
        } catch (err) {
            console.error("Error fetching Distribution of Neomers on Cancer Types for different lengths:", err);
            setErrorDoughnut("Failed to fetch cancer type statistics.");
            setLoadingDoughnut(false);
        }
    };

    const multiDoughnutData = useMemo(() => {
        if (!lengthCancerStats || Object.keys(lengthCancerStats).length === 0) return null;
        const cancerTypesSet = new Set();
        Object.values(lengthCancerStats).forEach((statsArray) => {
            statsArray.forEach((stat) => {
                cancerTypesSet.add(stat.cancer_type);
            });
        });
        const cancerTypes = Array.from(cancerTypesSet).sort();
        const colorMap = {};
        cancerTypes.forEach((type, index) => {
            colorMap[type] = COLORS[index % COLORS.length];
        });
        const lengths = Object.keys(lengthCancerStats)
            .map(Number)
            .sort((a, b) => a - b);
        const totalLayers = lengths.length;
        const layerWidthPercentage = (100 / (totalLayers + 1));
        const datasets = lengths.map((length, index) => {
            const statsArray = lengthCancerStats[length];
            const data = cancerTypes.map((type) => {
                const stat = statsArray.find((s) => s.cancer_type === type);
                return stat ? stat.count : 0;
            });
            const outerRadius = `${(index + 1) * layerWidthPercentage}%`;
            const innerRadius = `${index * layerWidthPercentage}%`;
            return {
                label: `Length ${length}`,
                data,
                backgroundColor: cancerTypes.map((type) => colorMap[type]),
                radius: outerRadius,
                cutout: innerRadius,
                borderWidth: 1,
                borderColor: '#fff',
            };
        });
        return {
            labels: cancerTypes,
            datasets: datasets,
        };
    }, [lengthCancerStats]);

    const doughnutOptions = useMemo(() => {
        if (!multiDoughnutData) return {};
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',  // Positioning the legend on top of the chart
                    labels: {
                        font: {
                            size: 14, // Increase legend font size
                        },
                    },
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const datasetLabel = context.dataset.label || '';
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${datasetLabel} - ${label}: ${value}`;
                        },
                    },
                },
            },
            zoom: {
                enabled: true, // Enable zoom
                mode: 'xy', // Allow zooming on both axes
                rangeMin: {
                    // Set minimum zoom-out limits
                    x: 1,
                    y: 1
                },
                rangeMax: {
                    // Set maximum zoom-in limits
                    x: 10,
                    y: 10
                },
                sensitivity: 3, // Adjust the zoom sensitivity
            },
        };
    }, [multiDoughnutData]);


    const heatmapData = useMemo(() => {
        if (!jaccardData.length) return null;
        const allCancerTypes = new Set();

        jaccardData.forEach((item) => {
            allCancerTypes.add(item.cancer_type_a);
            allCancerTypes.add(item.cancer_type_b);
        });

        const cancerTypes = Array.from(allCancerTypes).sort();
        const dataMap = {};
        jaccardData.forEach((item) => {
            const key = `${item.cancer_type_a}|${item.cancer_type_b}`;
            dataMap[key] = item;
        });

        const dataPoints = cancerTypes.flatMap((typeA) =>
            cancerTypes.map((typeB) => {
                const key = `${typeA}|${typeB}`;
                const item = dataMap[key] || { jaccard_index: 0 };

                const logJaccard = Math.log(item.jaccard_index + 1e-6);
                return {
                    x: typeA,
                    y: typeB,
                    v: logJaccard,
                    jaccard_index: item.jaccard_index,
                    backgroundColor: getColorForLogJaccard(logJaccard),
                };
            })
        );

        return {
            labels: cancerTypes,
            datasets: [
                {
                    data: dataPoints,
                    backgroundColor: dataPoints.map((pt) => pt.backgroundColor),
                    borderWidth: 1,
                    width: 50,
                    height: 25,
                },
            ],
        };
    }, [jaccardData]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const raw = context.raw;
                        return [
                            `${raw.x} & ${raw.y}`,
                            `Jaccard Similarity: ${raw.jaccard_index.toFixed(3)}`,
                            `Log(Jaccard): ${raw.v.toFixed(3)}`,
                        ];
                    },
                },
            },
            legend: { display: false },
        },
        scales: {
            x: {
                type: "category",
                labels: heatmapData?.labels,
                ticks: { font: { size: 12, weight: "bold" } },
                grid: { color: "#ddd" },
            },
            y: {
                type: "category",
                labels: heatmapData?.labels,
                reverse: true,
                ticks: { font: { size: 12, weight: "bold" } },
                grid: { color: "#ddd" },
            },
        },
    }), [heatmapData]);

    return (
        <>
            <h2 className="text-3xl font-bold text-center mb-6">Visualizations</h2>
            <div className="flex flex-col md:flex-row gap-6" style={{ justifyContent: "center" }}>
                <div className="md:p-4 bg-white border border-gray-200 shadow-md rounded-lg" style={{ textAlign: 'center' }}>
                    <h3 className="text-2xl font-semibold mb-4 text-black">
                        Distribution of Neomers on Cancer Types for Different Lengths
                    </h3>
                    {loadingDoughnut && <Loader />}
                    {errorDoughnut && (
                        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
                            {errorDoughnut}
                        </div>
                    )}
                    {!loadingDoughnut && multiDoughnutData && (
                        <div style={{ width: '800px', height: '800px' }}> {/* Adjust dimensions as needed */}
                            <Doughnut data={multiDoughnutData} options={doughnutOptions} />
                        </div>
                    )}
                </div>
            </div>
            <div className="p-6 bg-gray-100 min-h-screen">
                <div className="bg-white p-6 rounded-lg shadow-lg" style={{ textAlign: 'center' }}>
                    <h3 className="text-2xl font-semibold mb-4 text-black">
                        Jaccard Similarity of Cancer Types on Neomers
                    </h3>
                    {loading && (
                        <Loader />
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
                                key={JSON.stringify(heatmapData)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Visualizations;
