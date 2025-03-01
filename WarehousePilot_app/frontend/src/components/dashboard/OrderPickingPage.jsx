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

const COLORS = ["#950606", "#ca3433"];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const OrderPickingPage = () => {
  // Pie Chart states
  const [pieData, setPieData] = useState([
    { name: "Accurate Picks", value: 0 },
    { name: "Inaccurate Picks", value: 0 },
  ]);
  const [totalPicks, setTotalPicks] = useState(0);
  const [accuracyPercentage, setAccuracyPercentage] = useState(0);
  const [loadingPie, setLoadingPie] = useState(true);
  const [errorPie, setErrorPie] = useState(null);

  // Bar Chart states (day -> picks)
  const [dailyData, setDailyData] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [errorDaily, setErrorDaily] = useState(null);

  // Detailed breakdown states (day + order -> picks)
  const [detailedData, setDetailedData] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);

  // Search/filter for daily picks
  const [filterValue, setFilterValue] = useState("");
  // Search/filter for detailed picks
  const [detailFilter, setDetailFilter] = useState("");

  const targetAccuracy = 99;

  /********************************************************
   * 1) Fetch overall accuracy data (Pie Chart)
   ********************************************************/
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

  /********************************************************
   * 2) Fetch daily picks data (Bar Chart)
   ********************************************************/
  const fetchDailyData = async (token) => {
    try {
      setLoadingDaily(true);
      setErrorDaily(null);

      const resp = await axios.get(
        `${API_BASE_URL}/kpi_dashboard/order-picking-daily-stats/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      

      // Sort ascending by date
      const sorted = resp.data.slice().sort((a, b) => a.day.localeCompare(b.day));
      setDailyData(sorted);
      setLoadingDaily(false);
    } catch (err) {
      console.error("Error fetching daily picks:", err);
      setErrorDaily("Failed to fetch daily picks data.");
      setLoadingDaily(false);
    }
  };

  /********************************************************
   * 3) Fetch detailed breakdown: day + order -> picks
   ********************************************************/
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

  /********************************************************
   * 4) Combined fetch for all endpoints
   ********************************************************/
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

  /********************************************************
   * 5) Filter logic for daily picks
   ********************************************************/
  const filteredDailyData = useMemo(() => {
    if (!filterValue.trim()) return dailyData;
    const searchTerm = filterValue.toLowerCase();
    return dailyData.filter((item) => {
      const dayMatch = item.day?.toLowerCase().includes(searchTerm);
      const picksMatch = item.picks?.toString().includes(searchTerm);
      return dayMatch || picksMatch;
    });
  }, [dailyData, filterValue]);

  /********************************************************
   * 6) Filter logic for daily order-level details
   ********************************************************/
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


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <NavBar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header & Refresh */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">Order Picking Details</h1>
          <Button color="primary" onPress={fetchAllData}>
            Refresh Data
          </Button>
        </div>

        {/* Error messages if no token, etc. */}
        {errorPie && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {errorPie}
          </div>
        )}
        {errorDaily && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {errorDaily}
          </div>
        )}
        {errorDetails && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {errorDetails}
          </div>
        )}

        {/* ==================== PIE CHART (Accuracy) ==================== */}
        {loadingPie ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600">Loading accuracy data...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-2">Picking Accuracy Overview</h2>

            {/* Summary Table */}
            <div className="overflow-x-auto mt-2 mb-4">
              <table className="min-w-full text-left border border-gray-300">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="px-4 py-2">Metric</th>
                    <th className="px-4 py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium">Total Picks</td>
                    <td className="px-4 py-2">{totalPicks.toLocaleString()}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium">Accurate Picks</td>
                    <td className="px-4 py-2">
                      {pieData[0]?.value.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium">Inaccurate Picks</td>
                    <td className="px-4 py-2">
                      {pieData[1]?.value.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Accuracy %</td>
                    <td
                      className={`px-4 py-2 font-semibold ${
                        accuracyPercentage >= targetAccuracy
                          ? "text-green-600"
                          : "text-red-600"
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
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          </div>
        )}

        {/* ==================== DAILY BAR CHART ==================== */}
        {loadingDaily ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600">Loading daily picks data...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Daily Picks (By Day)</h2>
              <div className="flex items-center gap-2">
                <Input
                  size="md"
                  placeholder="Search day or picks..."
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  endContent={<SearchIcon className="text-default-400" width={16} />}
                  className="w-full sm:w-72"
                />
              </div>
            </div>

            {filteredDailyData.length === 0 ? (
              <p className="text-gray-500 mt-4">
                No matches found for your search.
              </p>
            ) : (
              <div className="mt-6 flex justify-center">
                <BarChart width={600} height={300} data={filteredDailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="picks" fill="#82ca9d" />
                </BarChart>
              </div>
            )}
          </div>
        )}

        {/* ==================== DETAILED BREAKDOWN TABLE ==================== */}
        {loadingDetails ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600">Loading detailed picks data...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Daily Order Breakdown</h2>
              <div className="flex items-center gap-2">
                <Input
                  size="md"
                  placeholder="Search day, order #, or picks..."
                  value={detailFilter}
                  onChange={(e) => setDetailFilter(e.target.value)}
                  endContent={<SearchIcon className="text-default-400" width={16} />}
                  className="w-full sm:w-72"
                />
              </div>
            </div>

            {filteredDetailedData.length === 0 ? (
              <p className="text-gray-500 mt-4">
                No matches found for your search.
              </p>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left border border-gray-300">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Order ID</th>
                      <th className="px-4 py-2">Picked Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDetailedData.map((row, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-4 py-2">{row.day}</td>
                        <td className="px-4 py-2">{row.order_id}</td>
                        <td className="px-4 py-2">{row.picks}</td>
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






