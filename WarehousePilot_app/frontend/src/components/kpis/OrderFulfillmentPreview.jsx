import React, { useState, useEffect } from "react";
import axios from "axios";
import OrderFulfillmentBarChart from "./OrderFulfillmentBarChart";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000/kpi_dashboard";

const OrderFulfillmentPreview = () => {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [range, setRange] = useState("1D");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authorization token found");
          setLoading(false);
          return;
        }
        const response = await axios.get(
          `${API_BASE_URL}/order-fulfillment-rate/?filter=month&date=${today}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const result = response.data;
        if (!Array.isArray(result) || result.length === 0) {
          setAllData([]);
        } else {
          setAllData(result);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [today]);

  useEffect(() => {
    if (!allData.length) {
      setFilteredData([]);
      return;
    }
    const now = new Date();
    let startDate = new Date();
    if (range === "1D") {
      startDate.setDate(now.getDate() - 1);
    } else if (range === "1W") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "1M") {
      startDate.setMonth(now.getMonth() - 1);
    }
    const filtered = allData.filter((dayObj) => {
      const dayDate = new Date(dayObj.period);
      return dayDate >= startDate && dayDate <= now;
    });
    setFilteredData(filtered);
  }, [range, allData]);

  const handleRangeClick = (r) => {
    setRange(r);
  };

  const handleDetailsClick = () => {
    navigate("/order-fullfillement-dashboard"); 
  };


  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-700/50">
      {/* Inline style block for dark mode */}
      <style>{`
        .hide-chart-title h3 {
          display: none;
        }
      `}</style>

      {/* Header row */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Order Fulfillment
        </h2>
        <button
          onClick={handleDetailsClick}
          className="bg-gray-500 dark:bg-gray-700 hover:bg-red-600 dark:hover:bg-red-700 text-white py-1 px-3 rounded transition-colors"
        >
          View Details
        </button>
      </div>

      {/* Timeline Range Selector */}
      <div className="flex space-x-2 mb-4">
        {["1D", "1W", "1M"].map((label) => (
          <button
            key={label}
            onClick={() => handleRangeClick(label)}
            className={`px-4 py-2 rounded transition-colors ${
              range === label
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="text-center text-gray-600 dark:text-gray-400">Loading...</div>
      ) : error ? (
        <div className="text-red-500 dark:text-red-400 text-center">{error}</div>
      ) : filteredData.length > 0 ? (
        <div className="hide-chart-title">
          <OrderFulfillmentBarChart data={filteredData} />
        </div>
      ) : (
        <div className="text-center text-gray-600 dark:text-gray-400">
          No data available for the selected range.
        </div>
      )}
    </div>
  );
};

export default OrderFulfillmentPreview;