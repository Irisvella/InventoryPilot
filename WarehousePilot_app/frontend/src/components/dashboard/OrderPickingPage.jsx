import React, { useState, useEffect, useMemo } from "react";
import NavBar from "../navbar/App";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { Input, Button } from "@heroui/react";
import { SearchIcon } from "@heroui/shared-icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const COLORS_LIGHT = ["#950606", "#ca3433"];
const COLORS_DARK = ["#8884d8", "#ff4444"];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const OrderPickingPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pieData, setPieData] = useState([
    { name: "Accurate Picks", value: 0 },
    { name: "Inaccurate Picks", value: 0 },
  ]);
  const [totalPicks, setTotalPicks] = useState(0);
  const [accuracyPercentage, setAccuracyPercentage] = useState(0);
  const [loadingPie, setLoadingPie] = useState(true);
  const [errorPie, setErrorPie] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [errorDaily, setErrorDaily] = useState(null);
  const [detailedData, setDetailedData] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);
  const [filterValue, setFilterValue] = useState("");
  const [detailFilter, setDetailFilter] = useState("");
  const targetAccuracy = 99;
  const navigate = useNavigate();

  useEffect(() => {
    const htmlElement = document.documentElement;
    setIsDarkMode(htmlElement.classList.contains('dark'));
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(htmlElement.classList.contains('dark'));
        }
      });
    });
    
    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const fetchAccuracyData = async (token) => {
    try {
      setLoadingPie(true);
      setErrorPie(null);
      const resp = await axios.get(
        `${API_BASE_URL}/kpi_dashboard/order-picking-accuracy/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = resp.data;
      const accurate = result.inaccurate_picks || 0;
      const inaccurate = result.accurate_picks || 0;
      const total = accurate + inaccurate;
      setPieData([
        { name: "Accurate Picks", value: accurate },
        { name: "Inaccurate Picks", value: inaccurate },
      ]);
      const percentage = total > 0 ? ((accurate / total) * 100).toFixed(1) : 0;
      setTotalPicks(total);
      setAccuracyPercentage(percentage);
      setLoadingPie(false);
    } catch (err) {
      console.error("Error fetching accuracy data:", err);
      setErrorPie("Failed to fetch accuracy data.");
      setLoadingPie(false);
    }
  };

  const fetchDailyData = async (token) => {
    try {
      setLoadingDaily(true);
      setErrorDaily(null);
      const resp = await axios.get(
        `${API_BASE_URL}/kpi_dashboard/order-picking-daily-stats/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const sorted = resp.data.slice().sort((a, b) => a.day.localeCompare(b.day));
      setDailyData(sorted);
      setLoadingDaily(false);
    } catch (err) {
      console.error("Error fetching daily picks:", err);
      setErrorDaily("Failed to fetch daily picks data.");
      setLoadingDaily(false);
    }
  };

  const fetchDetailedData = async (token) => {
    try {
      setLoadingDetails(true);
      setErrorDetails(null);
      const resp = await axios.get(
        `${API_BASE_URL}/kpi_dashboard/order-picking-daily-details/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDetailedData(resp.data);
      setLoadingDetails(false);
    } catch (err) {
      console.error("Error fetching daily detailed picks:", err);
      setErrorDetails("Failed to fetch detailed picks data.");
      setLoadingDetails(false);
    }
  };

  const fetchAllData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErrorPie("No authorization token found.");
      setErrorDaily("No authorization token found.");
      setErrorDetails("No authorization token found.");
      return;
    }
    await Promise.all([
      fetchAccuracyData(token),
      fetchDailyData(token),
      fetchDetailedData(token)
    ]);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const filteredDailyData = useMemo(() => {
    if (!filterValue.trim()) return dailyData;
    const searchTerm = filterValue.toLowerCase();
    return dailyData.filter((item) => {
      const dayMatch = item.day?.toLowerCase().includes(searchTerm);
      const picksMatch = item.picks?.toString().includes(searchTerm);
      return dayMatch || picksMatch;
    });
  }, [dailyData, filterValue]);

  const filteredDetailedData = useMemo(() => {
    if (!detailFilter.trim()) return detailedData;
    const searchTerm = detailFilter.toLowerCase();
    return detailedData.filter((item) => {
      const dayMatch = item.day?.toLowerCase().includes(searchTerm);
      const orderMatch = item.order_id?.toLowerCase().includes(searchTerm);
      const picksMatch = item.picks?.toString().includes(searchTerm);
      return dayMatch || orderMatch || picksMatch;
    });
  }, [detailedData, detailFilter]);
  
  const handleViewDetails = () => {
    navigate('/kpi');
  };

  const colors = isDarkMode ? COLORS_DARK : COLORS_LIGHT;
  const bgColor = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-800';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-300';
  const tableHeaderBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-100';

  return (
    <div className={`min-h-screen ${bgColor}`}>
      <NavBar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex justify-between items-center mb-4 gap-4">
            <h1 className={`text-3xl font-bold ${textColor}`}>Order Picking Details</h1>
            <button 
              className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600'} text-white py-1 px-3 rounded`}
              onClick={handleViewDetails}
            >
              Back to KPI Overview
            </button>
          </div>
          <Button color="primary" onPress={fetchAllData}>
            Refresh Data
          </Button>
        </div>

        {/* Error messages */}
        {errorPie && (
          <div className={`border ${isDarkMode ? 'border-red-900 bg-red-900/20' : 'border-red-400 bg-red-100'} text-red-700 px-4 py-3 rounded relative mb-4 ${isDarkMode ? 'text-red-300' : ''}`}>
            {errorPie}
          </div>
        )}
        {errorDaily && (
          <div className={`border ${isDarkMode ? 'border-red-900 bg-red-900/20' : 'border-red-400 bg-red-100'} text-red-700 px-4 py-3 rounded relative mb-4 ${isDarkMode ? 'text-red-300' : ''}`}>
            {errorDaily}
          </div>
        )}
        {errorDetails && (
          <div className={`border ${isDarkMode ? 'border-red-900 bg-red-900/20' : 'border-red-400 bg-red-100'} text-red-700 px-4 py-3 rounded relative mb-4 ${isDarkMode ? 'text-red-300' : ''}`}>
            {errorDetails}
          </div>
        )}

        {/* PIE CHART (Accuracy) */}
        {loadingPie ? (
          <div className={`flex items-center justify-center h-64 ${cardBg} rounded-lg shadow p-6 mb-8`}>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading accuracy data...</p>
          </div>
        ) : (
          <div className={`${cardBg} rounded-lg shadow p-6 mb-8`}>
            <h2 className={`text-xl font-semibold mb-2 ${textColor}`}>Picking Accuracy Overview</h2>

            <div className="overflow-x-auto mt-2 mb-4">
              <table className={`min-w-full text-left border ${borderColor}`}>
                <thead className={`${tableHeaderBg} border-b ${borderColor}`}>
                  <tr>
                    <th className={`px-4 py-2 ${textColor}`}>Metric</th>
                    <th className={`px-4 py-2 ${textColor}`}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={`border-b ${borderColor}`}>
                    <td className={`px-4 py-2 font-medium ${textColor}`}>Total Picks</td>
                    <td className={`px-4 py-2 ${textColor}`}>{totalPicks.toLocaleString()}</td>
                  </tr>
                  <tr className={`border-b ${borderColor}`}>
                    <td className={`px-4 py-2 font-medium ${textColor}`}>Accurate Picks</td>
                    <td className={`px-4 py-2 ${textColor}`}>
                      {pieData[0]?.value.toLocaleString()}
                    </td>
                  </tr>
                  <tr className={`border-b ${borderColor}`}>
                    <td className={`px-4 py-2 font-medium ${textColor}`}>Inaccurate Picks</td>
                    <td className={`px-4 py-2 ${textColor}`}>
                      {pieData[1]?.value.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className={`px-4 py-2 font-medium ${textColor}`}>Accuracy %</td>
                    <td
                      className={`px-4 py-2 font-semibold ${
                        accuracyPercentage >= targetAccuracy
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {accuracyPercentage}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-center">
              <PieChart width={500} height={300}>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={isDarkMode ? { 
                    backgroundColor: '#2D3748',
                    borderColor: '#4A5568',
                    color: '#E2E8F0'
                  } : {}}
                />
                <Legend />
              </PieChart>
            </div>
          </div>
        )}

        {/* DAILY BAR CHART */}
        {loadingDaily ? (
          <div className={`flex items-center justify-center h-64 ${cardBg} rounded-lg shadow p-6 mb-8`}>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading daily picks data...</p>
          </div>
        ) : (
          <div className={`${cardBg} rounded-lg shadow p-6 mb-8`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className={`text-xl font-semibold ${textColor}`}>Daily Picks (By Day)</h2>
              <div className="flex items-center gap-2">
                <Input
                  size="md"
                  placeholder="Search day or picks..."
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  endContent={<SearchIcon className={isDarkMode ? "text-gray-400" : "text-default-400"} width={16} />}
                  className="w-full sm:w-72"
                  classNames={{
                    input: isDarkMode ? 'text-white' : '',
                    inputWrapper: isDarkMode ? 'bg-gray-700 border-gray-600' : ''
                  }}
                />
              </div>
            </div>

            {filteredDailyData.length === 0 ? (
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'} mt-4`}>
                No matches found for your search.
              </p>
            ) : (
              <div className="mt-6 flex justify-center">
                <BarChart width={600} height={300} data={filteredDailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4A5568' : '#E2E8F0'} />
                  <XAxis dataKey="day" stroke={isDarkMode ? '#E2E8F0' : '#1A202C'} />
                  <YAxis stroke={isDarkMode ? '#E2E8F0' : '#1A202C'} />
                  <Tooltip 
                    contentStyle={isDarkMode ? { 
                      backgroundColor: '#2D3748',
                      borderColor: '#4A5568',
                      color: '#E2E8F0'
                    } : {}}
                  />
                  <Legend />
                  <Bar dataKey="picks" fill={isDarkMode ? "#8884d8" : "#82ca9d"} />
                </BarChart>
              </div>
            )}
          </div>
        )}

        {/* DETAILED BREAKDOWN TABLE */}
        {loadingDetails ? (
          <div className={`flex items-center justify-center h-64 ${cardBg} rounded-lg shadow p-6`}>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading detailed picks data...</p>
          </div>
        ) : (
          <div className={`${cardBg} rounded-lg shadow p-6`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className={`text-xl font-semibold ${textColor}`}>Daily Order Breakdown</h2>
              <div className="flex items-center gap-2">
                <Input
                  size="md"
                  placeholder="Search day, order #, or picks..."
                  value={detailFilter}
                  onChange={(e) => setDetailFilter(e.target.value)}
                  endContent={<SearchIcon className={isDarkMode ? "text-gray-400" : "text-default-400"} width={16} />}
                  className="w-full sm:w-72"
                  classNames={{
                    input: isDarkMode ? 'text-white' : '',
                    inputWrapper: isDarkMode ? 'bg-gray-700 border-gray-600' : ''
                  }}
                />
              </div>
            </div>

            {filteredDetailedData.length === 0 ? (
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'} mt-4`}>
                No matches found for your search.
              </p>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className={`min-w-full text-left border ${borderColor}`}>
                  <thead className={`${tableHeaderBg} border-b ${borderColor}`}>
                    <tr>
                      <th className={`px-4 py-2 ${textColor}`}>Date</th>
                      <th className={`px-4 py-2 ${textColor}`}>Order ID</th>
                      <th className={`px-4 py-2 ${textColor}`}>Picked Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDetailedData.map((row, idx) => (
                      <tr key={idx} className={`border-b ${borderColor}`}>
                        <td className={`px-4 py-2 ${textColor}`}>{row.day}</td>
                        <td className={`px-4 py-2 ${textColor}`}>{row.order_id}</td>
                        <td className={`px-4 py-2 ${textColor}`}>{row.picks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPickingPage;