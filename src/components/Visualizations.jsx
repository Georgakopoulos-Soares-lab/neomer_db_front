// src/components/Visualizations.jsx

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
  LogarithmicScale,
  ArcElement,
  BarElement,
} from "chart.js";
import { Chart, Doughnut, Bar } from "react-chartjs-2";
import "chartjs-plugin-zoom";  // Import the chartjs zoom plugin
import Loader from "./Loader";
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
  LogarithmicScale,
  ArcElement,
  BarElement
);

const getColorForLogJaccard = (logJaccard) => {
  const epsilon = 1e-6;
  const normalized = (logJaccard - Math.log(epsilon)) / (0 - Math.log(epsilon));
  const clamped = Math.min(Math.max(normalized, 0), 1);
  const r = Math.round(255 * (1 - clamped));
  const g = Math.round(255 * clamped);
  const b = 50;
  return `rgb(${r}, ${g}, ${b})`;
};

const COLORS = [
  "#e6194b", "#3cb44b", "#ffe119", "#0082c8", "#f58231",
  "#911eb4", "#46f0f0", "#f032e6", "#d2f53c", "#fabebe",
  "#008080", "#e6beff", "#aa6e28", "#fffac8", "#800000",
  "#aaffc3", "#808000", "#ffd8b1", "#000080", "#808080"
];

const Visualizations = () => {
  const [K] = useState(13);

  // Jaccard states
  const [jaccardData, setJaccardData] = useState([]);
  const [loadingJaccard, setLoadingJaccard] = useState(false);

  // Multi‐doughnut states
  const [lengthCancerStats, setLengthCancerStats] = useState([]);
  const [loadingDoughnut, setLoadingDoughnut] = useState(false);

  // Distribution per cancer
  const [cancerTypes, setCancerTypes] = useState([]);
  const [selectedCancer, setSelectedCancer] = useState("");
  const [cancerDist, setCancerDist] = useState([]);
  const [loadingCancerDist, setLoadingCancerDist] = useState(false);

  // Distribution per organ
  const [organs, setOrgans] = useState([]);
  const [selectedOrgan, setSelectedOrgan] = useState("");
  const [organDist, setOrganDist] = useState([]);
  const [loadingOrganDist, setLoadingOrganDist] = useState(false);

  // Fetch on mount
  useEffect(() => {
    fetchJaccardData();
    fetchLengthCancerStats();
    fetchCancerTypes();
    fetchOrgans();
  }, []);

  // 1) Jaccard
  const fetchJaccardData = async () => {
    try {
      setLoadingJaccard(true);
      const resp = await axios.get(`${Constants.API_URL}/jaccard_index`, { params: { K } });
      setJaccardData(resp.data.jaccard_indices);
    } catch {
      // handle error silently
    } finally {
      setLoadingJaccard(false);
    }
  };

  // 2) Multi‐doughnut
  const fetchLengthCancerStats = () => {
    setLoadingDoughnut(true);
    try {
      setLengthCancerStats(Constants.multi_doughnut_cached_data);
    } finally {
      setLoadingDoughnut(false);
    }
  };

  // 3) Cancer types list
  const fetchCancerTypes = async () => {
    try {
      const resp = await axios.get(`${Constants.API_URL}/distribution_neomer_16/cancer_types`);
      const types = resp.data.cancerTypes || [];
      setCancerTypes(types);
      if (types.length) setSelectedCancer(types[0]);
    } catch {
      // silent
    }
  };

  // 4) Organs list
  const fetchOrgans = async () => {
    try {
      const resp = await axios.get(`${Constants.API_URL}/distribution_neomer_16/organs`);
      const ovs = resp.data.organs || [];
      setOrgans(ovs);
      if (ovs.length) setSelectedOrgan(ovs[0]);
    } catch {
      // silent
    }
  };

  // 5) Fetch cancer distribution
  useEffect(() => {
    if (!selectedCancer) return;
    (async () => {
      setLoadingCancerDist(true);
      try {
        const resp = await axios.get(`${Constants.API_URL}/distribution_neomer_16`, {
          params: { cancerType: selectedCancer }
        });
        setCancerDist(resp.data.distribution || []);
      } catch {
        // silent
      } finally {
        setLoadingCancerDist(false);
      }
    })();
  }, [selectedCancer]);

  // 6) Fetch organ distribution
  useEffect(() => {
    if (!selectedOrgan) return;
    (async () => {
      setLoadingOrganDist(true);
      try {
        const resp = await axios.get(`${Constants.API_URL}/distribution_neomer_16_organs`, {
          params: { organ: selectedOrgan }
        });
        setOrganDist(resp.data.distribution || []);
      } catch {
        // silent
      } finally {
        setLoadingOrganDist(false);
      }
    })();
  }, [selectedOrgan]);

  // Multi-doughnut data
  const multiDoughnutData = useMemo(() => {
    if (!lengthCancerStats || !Object.keys(lengthCancerStats).length) return null;
    const types = Array.from(
      new Set(Object.values(lengthCancerStats).flat().map(r => r.cancer_type))
    ).sort();
    const colorMap = Object.fromEntries(types.map((t,i)=>[t,COLORS[i%COLORS.length]]));
    const lengths = Object.keys(lengthCancerStats).map(Number).sort((a,b)=>a-b);
    const lw = 100/(lengths.length+1);
    const datasets = lengths.map((len,i)=>({
      label:`Len ${len}`,
      data: types.map(t=>{
        const rec = lengthCancerStats[len].find(r=>r.cancer_type===t);
        return rec?rec.count:0;
      }),
      backgroundColor: types.map(t=>colorMap[t]),
      radius:`${(i+1)*lw}%`,
      cutout:`${i*lw}%`,
      borderColor:"#fff", borderWidth:1
    }));
    return { labels: types, datasets };
  }, [lengthCancerStats]);

  const doughnutOpts = useMemo(() => ({
    responsive:true, maintainAspectRatio:false,
    plugins:{
      legend:{ position:"top" },
      tooltip:{ callbacks:{ label: ctx => `${ctx.dataset.label} ${ctx.label}: ${ctx.parsed}` }}
    },
    zoom:{ enabled:true, mode:"xy" }
  }), []);

  // Heatmap data
  const heatmapData = useMemo(() => {
    if (!jaccardData.length) return null;
    const types = Array.from(new Set(jaccardData.flatMap(i=>[i.cancer_type_a,i.cancer_type_b]))).sort();
    const map = Object.fromEntries(jaccardData.map(i=>[`${i.cancer_type_a}|${i.cancer_type_b}`, i]));
    const points = types.flatMap(a=>types.map(b=>{
      const r = map[`${a}|${b}`]||{ jaccard_index:0 };
      const v = Math.log(r.jaccard_index+1e-6);
      return { x:a, y:b, jaccard_index:r.jaccard_index, v, backgroundColor:getColorForLogJaccard(v) };
    }));
    return { labels: types, datasets:[{ data: points, backgroundColor: points.map(p=>p.backgroundColor), borderWidth:1 }] };
  }, [jaccardData]);

  const heatmapOpts = useMemo(() => ({
    responsive:true, maintainAspectRatio:false,
    plugins:{
      tooltip:{ callbacks:{ label: ctx => [
        `${ctx.raw.x} vs ${ctx.raw.y}`,
        `Jaccard: ${ctx.raw.jaccard_index.toFixed(3)}`
      ]}},
      legend:{ display:false }
    },
    scales:{
      x:{ type:"category", labels: heatmapData?.labels, grid:{ color:"#ddd" } },
      y:{ type:"category", labels: heatmapData?.labels, reverse:true, grid:{ color:"#ddd" } }
    }
  }), [heatmapData]);

  // Build bar data
  const makeBarData = (arr) => ({
    labels: arr.map(d=>d.donorCount.toString()),
    datasets:[{ label:"# Neomers", data: arr.map(d=>d.numNullomers), backgroundColor:"rgba(59,130,246,0.7)" }]
  });

  const barOpts = (title) => ({
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ position:"top" }, title:{ display:!!title, text:title } },
    scales:{
      x:{ title:{ display:true, text:"Donor Count" } },
      y:{ type:"logarithmic", title:{ display:true, text:"# Neomers" }, ticks:{ callback: v=>v.toLocaleString() } }
    }
  });

  return (
    <>
      <h2 className="text-3xl font-bold text-center mb-6">Visualizations</h2>

      {/* Doughnut */}
      <div className="flex justify-center mb-8">
        <div className="p-4 bg-white border shadow rounded" style={{ width:800, height:800 }}>
          <h3 className="text-2xl font-semibold mb-4">Neomers by Cancer Type & Length</h3>
          {loadingDoughnut ? <Loader/> : multiDoughnutData && (
            <Doughnut data={multiDoughnutData} options={doughnutOpts}/>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="flex justify-center mb-8">
        <div className="p-6 bg-white border shadow rounded" style={{ width:"90%", height:700 }}>
          <h3 className="text-2xl font-semibold mb-4">Jaccard Similarity</h3>
          {loadingJaccard ? <Loader/> : heatmapData && (
            <Chart type="matrix" data={heatmapData} options={heatmapOpts}/>
          )}
        </div>
      </div>

      {/* Cancer Distribution */}
      <div className="flex justify-center mb-8">
        <div className="p-6 bg-white border shadow rounded" style={{ width:"80%", height:500 }}>
          <h3 className="text-2xl font-semibold mb-4">Distribution (k=16) by Cancer</h3>
          <label className="block mb-4">
            <span className="text-gray-700">Cancer Type:</span>
            <select
              className="mt-1 block w-full rounded border-gray-300 px-3 py-2 focus:ring-blue-300"
              value={selectedCancer}
              onChange={e=>setSelectedCancer(e.target.value)}
            >
              {cancerTypes.map(ct=>(
                <option key={ct} value={ct}>{ct}</option>
              ))}
            </select>
          </label>
          {loadingCancerDist ? <Loader/> : (
            <div style={{ width:"100%", height:300 }}>
              <Bar
                data={makeBarData(cancerDist)}
                options={barOpts(`Cancer: ${selectedCancer}`)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Organ Distribution */}
      <div className="flex justify-center mb-8">
        <div className="p-6 bg-white border shadow rounded" style={{ width:"80%", height:500 }}>
          <h3 className="text-2xl font-semibold mb-4">Distribution (k=16) by Organ</h3>
          <label className="block mb-4">
            <span className="text-gray-700">Organ:</span>
            <select
              className="mt-1 block w-full rounded border-gray-300 px-3 py-2 focus:ring-blue-300"
              value={selectedOrgan}
              onChange={e=>setSelectedOrgan(e.target.value)}
            >
              {organs.map(o=>(
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
          {loadingOrganDist ? <Loader/> : (
            <div style={{ width:"100%", height:300 }}>
              <Bar
                data={makeBarData(organDist)}
                options={barOpts(`Organ: ${selectedOrgan}`)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Visualizations;
