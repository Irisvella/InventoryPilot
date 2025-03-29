import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SideBar from "../dashboard_sidebar1/App";
import NavBar from "../navbar/App";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const ActiveOrdersDetails = ({ userData }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    orderId: "",
    assignedEmployee: "",
    status: "",
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode class on the HTML element
    const htmlElement = document.documentElement;
    setIsDarkMode(htmlElement.classList.contains('dark'));
    
    // Set up a mutation observer to watch for class changes
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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/kpi_dashboard/active-orders-details/`
        );
        setOrders(response.data);
      } catch (err) {
        setError(err.message || "Failed to load orders data.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredOrders = orders.filter(
    (order) =>
      (filters.orderId === "" ||
        order.order_id.toString().includes(filters.orderId)) &&
      (filters.assignedEmployee === "" ||
        order.assigned_employee
          .toLowerCase()
          .includes(filters.assignedEmployee.toLowerCase())) &&
      (filters.status === "" ||
        order.items.some(
          (item) => item.status.toLowerCase() === filters.status.toLowerCase()
        ))
  );

  // Prepare data for BarChart (Items per Order)
  const barChartData = filteredOrders.map((order) => ({
    name: `Order ${order.order_id}`,
    items: order.items.length,
  }));

  // Prepare data for PieChart (Status Distribution)
  const statusCounts = filteredOrders.reduce((acc, order) => {
    order.items.forEach((item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
    });
    return acc;
  }, {});
  const pieChartData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));
  const COLORS = isDarkMode ? ["#8884d8", "#ff4444"] : ["#8B0000", "#A52A2A"];

  const handleViewDetails = () => {
    navigate('/kpi');
  };

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <SideBar userData={userData} isOpen={isSidebarOpen} />

      <div className="flex-1 sm:ml-10 sm:mt-2">
        <NavBar />
        <div className="flex-1 p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className={`text-3xl font-bold mb-6 ml-10 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Active Orders Details
            </h1>
            <button 
              className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600'} text-white py-1 px-3 rounded`}
              onClick={handleViewDetails}
            >
              Back to KPI Overview
            </button>
          </div>

          {/* Filter Section */}
          <div className={`mb-6 p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                name="orderId"
                placeholder="Filter by Order ID"
                value={filters.orderId}
                onChange={handleFilterChange}
                className={`p-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}`}
              />
              <input
                type="text"
                name="assignedEmployee"
                placeholder="Filter by Assigned Employee"
                value={filters.assignedEmployee}
                onChange={handleFilterChange}
                className={`p-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}`}
              />
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className={`p-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}`}
              >
                <option value="">All Statuses</option>
                <option value="Picked">Picked</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Graphs Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Bar Chart: Items per Order */}
            <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Items per Order</h2>
              {filteredOrders.length > 0 ? (
                <BarChart width={500} height={300} data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4A5568' : '#E2E8F0'} />
                  <XAxis dataKey="name" stroke={isDarkMode ? '#E2E8F0' : '#1A202C'} />
                  <YAxis stroke={isDarkMode ? '#E2E8F0' : '#1A202C'} />
                  <Tooltip 
                    contentStyle={isDarkMode ? { 
                      backgroundColor: '#2D3748',
                      borderColor: '#4A5568',
                      color: '#E2E8F0'
                    } : {}}
                  />
                  <Bar dataKey="items" fill={isDarkMode ? "#8884d8" : "#8B0000"} />
                </BarChart>
              ) : (
                <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>No data to display</p>
              )}
            </div>

            {/* Pie Chart: Status Distribution */}
            <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Item Status Distribution
              </h2>
              {pieChartData.length > 0 ? (
                <PieChart width={500} height={300}>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
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
              ) : (
                <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>No data to display</p>
              )}
            </div>
          </div>

          {/* Orders Table */}
          {loading ? (
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div className={`p-4 rounded-lg shadow overflow-x-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <table className="min-w-full">
                <thead>
                  <tr className={isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}>
                    <th className={`p-2 text-left ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Order ID</th>
                    <th className={`p-2 text-left ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Start Date</th>
                    <th className={`p-2 text-left ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Due Date</th>
                    <th className={`p-2 text-left ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Assigned To</th>
                    <th className={`p-2 text-left ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.order_id} className={isDarkMode ? 'border-gray-700 border-t' : 'border-t'}>
                      <td className={`p-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{order.order_id}</td>
                      <td className={`p-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{order.start_date}</td>
                      <td className={`p-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{order.due_date}</td>
                      <td className={`p-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{order.assigned_employee}</td>
                      <td className={`p-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        <ul>
                          {order.items.map((item, index) => (
                            <li key={index}>
                              {item.sku_color} - Qty: {item.quantity} - Loc:{" "}
                              {item.location} - Status: {item.status}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveOrdersDetails;