import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SideBar from "../dashboard_sidebar1/App";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const ActiveOrdersDetails = ({ userData }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    orderId: "",
    assignedEmployee: "",
    status: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/kpi_dashboard/active-orders-details/`);
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

  const filteredOrders = orders.filter(order => 
    (filters.orderId === "" || order.order_id.toString().includes(filters.orderId)) &&
    (filters.assignedEmployee === "" || order.assigned_employee.toLowerCase().includes(filters.assignedEmployee.toLowerCase())) &&
    (filters.status === "" || order.items.some(item => item.status.toLowerCase() === filters.status.toLowerCase()))
  );

  // Prepare data for BarChart (Items per Order)
  const barChartData = filteredOrders.map(order => ({
    name: `Order ${order.order_id}`,
    items: order.items.length,
  }));

  // Prepare data for PieChart (Status Distribution)
  const statusCounts = filteredOrders.reduce((acc, order) => {
    order.items.forEach(item => {
      acc[item.status] = (acc[item.status] || 0) + 1;
    });
    return acc;
  }, {});
  const pieChartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ['#8B0000', '#A52A2A']; // Dark red for Picked, slightly lighter dark red for Pending

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideBar userData={userData} isOpen={isSidebarOpen} />
      <div className="flex-1 p-6">
        <div> </div>
        <h1 className="text-3xl font-bold mb-6 ml-10">Active Orders Details</h1> 

        {/* Filter Section */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              name="orderId"
              placeholder="Filter by Order ID"
              value={filters.orderId}
              onChange={handleFilterChange}
              className="p-2 border rounded"
            />
            <input
              type="text"
              name="assignedEmployee"
              placeholder="Filter by Assigned Employee"
              value={filters.assignedEmployee}
              onChange={handleFilterChange}
              className="p-2 border rounded"
            />
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="p-2 border rounded"
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
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Items per Order</h2>
            {filteredOrders.length > 0 ? (
              <BarChart width={500} height={300} data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="items" fill="#8B0000" /> {/* Dark red color */}
              </BarChart>
            ) : (
              <p className="text-center">No data to display</p>
            )}
          </div>

          {/* Pie Chart: Status Distribution */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Item Status Distribution</h2>
            {pieChartData.length > 0 ? (
              <PieChart width={500} height={300}>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8B0000" // Base dark red color
                  dataKey="value"
                  label
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : (
              <p className="text-center">No data to display</p>
            )}
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Order ID</th>
                  <th className="p-2 text-left">Start Date</th>
                  <th className="p-2 text-left">Due Date</th>
                  <th className="p-2 text-left">Assigned To</th>
                  <th className="p-2 text-left">Items</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.order_id} className="border-t">
                    <td className="p-2">{order.order_id}</td>
                    <td className="p-2">{order.start_date}</td>
                    <td className="p-2">{order.due_date}</td>
                    <td className="p-2">{order.assigned_employee}</td>
                    <td className="p-2">
                      <ul>
                        {order.items.map((item, index) => (
                          <li key={index}>
                            {item.sku_color} - Qty: {item.quantity} - Loc: {item.location} - Status: {item.status}
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
  );
};

export default ActiveOrdersDetails;


