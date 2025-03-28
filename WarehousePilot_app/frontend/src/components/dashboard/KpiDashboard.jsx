import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Added for navigation
// import Header from "../dashboard_sidebar/Header";
import CycleTime from "./CycleTime";
import OrderPickingAccuracy from "./OrderPickingAccuracy";
// import StockLevels from "./StockLevels";
import WarehouseThroughput from "./WarehouseThroughput";
// import OrderFulfillmentRate from "./OrderFulfillmentRate";
// import StockLevelsPreview from "./StockLevelsPreview";
import ThroughputThresholdKpiPreview from "../kpis/throughput-threshold/throughput-threshold-kpi-preview"
import OrderFulfillmentPreview from "../kpis/OrderFulfillmentPreview"
import SideBar from "../dashboard_sidebar1/App";
import NavBar from "../navbar/App";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import CTPOPreview from "../kpis/CTPO/CTPOPreview";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const KPIDashboard = ({ userData }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeOrdersData, setActiveOrdersData] = useState([]);
  const [completedOrdersData, setCompletedOrdersData] = useState([]);
  const [totalActiveOrders, setTotalActiveOrders] = useState(0);
  const [totalCompletedOrders, setTotalCompletedOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [activeResponse, completedResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/kpi_dashboard/active-orders/`),
          axios.get(`${API_BASE_URL}/kpi_dashboard/completed-orders/`),
        ]);
        console.log("Active Orders Data:", activeResponse.data);
        console.log("Completed Orders Data:", completedResponse.data);
        setActiveOrdersData(activeResponse.data);
        setCompletedOrdersData(completedResponse.data);
        const activeTotal = activeResponse.data.reduce((sum, entry) => sum + entry.active_orders, 0);
        const completedTotal = completedResponse.data.reduce((sum, entry) => sum + entry.completed_orders, 0);
        setTotalActiveOrders(activeTotal);
        setTotalCompletedOrders(completedTotal);
      } catch (err) {
        console.error("Error fetching orders data:", err);
        setError(err.message || "Failed to load orders data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to handle navigation to details page
  const handleViewDetails = () => {
    navigate('/active-orders-details');
  };

  return (
    <div className="flex min-h-screen bg-gray-100 " >
      {/* Sidebar */}
      <SideBar userData={userData} isOpen={isSidebarOpen} />
      
           
            <div className="flex-1 sm:ml-10 sm:mt-2">
            <NavBar />
        {/* KPI Dashboard Content */}
        <main className="flex-1 p-12">
          {/* Title */}
          {/* <h1 className="text-3xl font-bold text-center m-6">KPI Dashboard</h1> */}

          {/* Overview Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Individual metric cards */}
            <div className="bg-white p-4 shadow rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Active Orders</h2>
                <button
                  onClick={handleViewDetails}
                  className="bg-gray-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                >
                  View Details
                </button>
              </div>
              {loading ? (
                <p className="text-center">Loading...</p>
              ) : error ? (
                <p className="text-red-500 text-center">{error}</p>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-3xl font-bold">{totalActiveOrders.toLocaleString()}</p>
                  </div>
                  <div>
                    <LineChart width={300} height={150} data={activeOrdersData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Line type="monotone" dataKey="active_orders" stroke="#8884d8" dot={false} />
                    </LineChart>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white p-4 shadow rounded-lg">
              <h2 className="text-xl font-semibold">Completed Orders</h2>
              {loading ? (
                <p className="text-center">Loading...</p>
              ) : error ? (
                <p className="text-red-500 text-center">{error}</p>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-3xl font-bold">{totalCompletedOrders.toLocaleString()}</p>
                    <p className="text-red-500">-25%</p>
                  </div>
                  <div>
                    <LineChart width={300} height={150} data={completedOrdersData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Line type="monotone" dataKey="completed_orders" stroke="#ff4444" dot={false} />
                    </LineChart>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white ps-4 p-4 shadow rounded-lg">
              <h2 className="text-xl font-semibold"></h2>
              <div className="accuracy-metrics">
                <OrderPickingAccuracy />
              </div>
            </div>
            {/* <div className="bg-white p-4 shadow rounded-lg">
              <h2 className="text-xl font-semibold">Sessions</h2>
              <p className="text-3xl font-bold">13,277</p>
              <p className="text-green-500">+35%</p>
            </div> */}
          </div>

          {/* Graph Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left graph */}
            <div className="bg-white p-4 shadow rounded-lg flex flex-col h-full">

              <ThroughputThresholdKpiPreview/>
            </div>

            {/* Right graph */}
            <div className="bg-white p-4 shadow rounded-lg flex flex-col h-full">
              {/* Placeholder for graph */}
              <OrderFulfillmentPreview/>
            </div>
          </div>

          {/* Graph Section */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* CTPO graph */}
            <div className="bg-white p-4 shadow rounded-lg flex flex-col h-full">
              <CTPOPreview />
              {/* Placeholder for graph */}
            </div>
          </div>         

          {/* Details Section */}
          <div className="mt-6 bg-white p-4 shadow rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Details</h2>
            {/* Placeholder for table or additional data */}
            <div className="h-64 bg-gray-200 flex items-center justify-center">
              Table/Data Placeholder
            </div>
          </div>

          {/* Cards Container */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CycleTime />
            <OrderPickingAccuracy />
            <StockLevels />
            <WarehouseThroughput />
            <OrderFulfillmentRate />
            <StockLevels />
          </div> */}
        </main>
      </div>
    </div>
  );
};

export default KPIDashboard;
