/* "View Details" button has been tested on all cards where it's present: 
 Active Orders, Order Picking Accuracy,Throughput Threshold,Order fulfillment,Cycle Time Per Order.*/
/*The date buttons: 1d, 1w, 1m, 1 year have been tested */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CycleTime from "./CycleTime";
import OrderPickingAccuracy from "./OrderPickingAccuracy";
import WarehouseThroughput from "./WarehouseThroughput";
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

  const handleViewDetails = () => {
    navigate('/active-orders-details');
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <SideBar userData={userData} isOpen={isSidebarOpen} />
      
      <div className="flex-1 sm:ml-10 sm:mt-2">
        <NavBar />
        <main className="flex-1 p-12">
          {/* Overview Section - Top 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Active Orders Card */}
            <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Active Orders</h2>
                <button
                  onClick={handleViewDetails}
                  className="bg-gray-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                >
                  View Details
                </button>
              </div>
              {loading ? (
                <p className="text-center text-gray-800 dark:text-white">Loading...</p>
              ) : error ? (
                <p className="text-red-500 text-center">{error}</p>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalActiveOrders.toLocaleString()}</p>
                  </div>
                  <div>
                    <LineChart width={300} height={150} data={activeOrdersData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#4A5568' : '#E2E8F0'} />
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Line type="monotone" dataKey="active_orders" stroke="#8884d8" dot={false} />
                    </LineChart>
                  </div>
                </div>
              )}
            </div>

            {/* Completed Orders Card */}
            <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Completed Orders</h2>
              {loading ? (
                <p className="text-center text-gray-800 dark:text-white">Loading...</p>
              ) : error ? (
                <p className="text-red-500 text-center">{error}</p>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalCompletedOrders.toLocaleString()}</p>
                    <p className="text-red-500">-25%</p>
                  </div>
                  <div>
                    <LineChart width={300} height={150} data={completedOrdersData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#4A5568' : '#E2E8F0'} />
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Line type="monotone" dataKey="completed_orders" stroke="#ff4444" dot={false} />
                    </LineChart>
                  </div>
                </div>
              )}
            </div>

            {/* Order Picking Accuracy Card */}
            <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Order Picking Accuracy</h2>
              <div className="accuracy-metrics">
                <OrderPickingAccuracy />
              </div>
            </div>
          </div>

          {/* First Row of Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg">
              <ThroughputThresholdKpiPreview/>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg">
              <OrderFulfillmentPreview/>
            </div>
          </div>

          {/* Second Row of Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg">
              <CTPOPreview />
            </div>
            {/* You can add another graph here if needed */}
          </div>

          {/* Details Section */}
          <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Details</h2>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              Table/Data Placeholder
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default KPIDashboard;