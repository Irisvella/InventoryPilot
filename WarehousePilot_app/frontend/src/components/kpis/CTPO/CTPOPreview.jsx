import React, { useState, useEffect } from "react";
import axios from "axios";
import CTPOBarChart from "./CTPOBarChart";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CTPOPreview = () => {
  const [allData, setAllData] = useState([]);         // Complete dataset from the API
  const [filteredData, setFilteredData] = useState([]);   // Data filtered by timeline
  const [range, setRange] = useState("1D");              // Timeline: 1D, 1W, or 1M
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use today's date as reference (YYYY-MM-DD)
  const today = new Date().toISOString().split("T")[0];

  // Fetch data using filter=month and today's date so we get the current month's daily data
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
        //`${API_BASE_URL}/order-fulfillment-rate/?filter=month&date=${today}`,
        // Using filter=month ensures that we get daily records for the entire current month
        const response = await axios.get(
          `${API_BASE_URL}/orders/ctpo_preview/?filter=month&date=${today}`,
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

  // Filter the full dataset based on the selected timeline.
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
    // Filter allData (which are daily records) based on the timeline range
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
    window.location.href = "http://localhost:5173/CTPO";
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      {/* Inline style block to hide the header (h3) within the chart */}
      <style>{`
        .hide-chart-title h3 {
          display: none;
        }
      `}</style>

      {/* Header row: Title + Details button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Cycle Time Per Order</h2>
        <button
          onClick={handleDetailsClick}
          className="bg-blue-500 text-white px-4 py-2 rounded"
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
            className={`px-4 py-2 rounded ${
              range === label
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bar Chart wrapped in a div that hides the inner h3 title */}
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : filteredData.length > 0 ? (
        <div className="hide-chart-title">
          <CTPOBarChart data={filteredData} />
        </div>
      ) : (
        <div className="text-center">
          No data available for the selected range.
        </div>
      )}
    </div>
  );
};

export default CTPOPreview;

