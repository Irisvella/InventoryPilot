import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OrderFulfillmentChart from './OrderFulfillmentChart';
import OrderFulfillmentTable from './OrderFulfillmentTable';
import OrderFulfillmentBarChart from './OrderFulfillmentBarChart';
import NavBar from "../navbar/App";

const API_BASE_URL = "http://127.0.0.1:8000/kpi_dashboard"; // Update with your backend URL

const OrderFulfillmentDashboard = () => {
  const [data, setData] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [filterType, setFilterType] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filterType, selectedDate]);

  const fetchData = async () => {
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
        `${API_BASE_URL}/order-fulfillment-rate/?filter=${filterType}&date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = response.data;
      if (!Array.isArray(result) || result.length === 0) {
        setData([]);
        setCurrentPeriod(null);
      } else {
        setData(result);
        const aggregated = aggregatePeriodData(result);
        setCurrentPeriod(aggregated);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data");
      setData([]);
      setCurrentPeriod(null);
    } finally {
      setLoading(false);
    }
  };

  const aggregatePeriodData = (dailyArray) => {
    let ordersStartedSum = 0;
    let partiallyFulfilledSum = 0;
    let fullyFulfilledSum = 0;

    dailyArray.forEach((day) => {
      ordersStartedSum += day.orders_started || 0;
      partiallyFulfilledSum += day.partially_fulfilled || 0;
      fullyFulfilledSum += day.fully_fulfilled || 0;
    });

    const totalOrdersCount = dailyArray[dailyArray.length - 1].total_orders_count || 0;

    return {
      period: selectedDate,
      total_orders_count: totalOrdersCount,
      orders_started: ordersStartedSum,
      partially_fulfilled: partiallyFulfilledSum,
      fully_fulfilled: fullyFulfilledSum,
    };
  };

  const formatPeriodDate = (dateStr) => {
    if (!dateStr) return "N/A";
    
    const date = new Date(dateStr);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    if (filterType === 'month') {
      // For monthly, you can hide day if you prefer:
      // options.day = undefined;
    } else if (filterType === 'week') {
      return `Week of ${date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })}`;
    }
    
    return date.toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <NavBar />

      <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-700/50">
          {/* Filter controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Order Fulfillment Dashboard
            </h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full md:w-auto">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)} 
                className="border rounded-md px-2 py-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="border rounded-md px-2 py-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Main content */}
          {error ? (
            <div className="text-red-500 dark:text-red-400 text-center p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
              {error}
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-700 rounded-lg shadow-sm p-4">
              <div className="animate-pulse text-gray-600 dark:text-gray-400">Loading data...</div>
            </div>
          ) : currentPeriod ? (
            <div className="flex flex-col gap-6">
              {/* Donut Chart & Table with aggregated data */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OrderFulfillmentChart currentPeriod={currentPeriod} />
                <OrderFulfillmentTable 
                  currentPeriod={currentPeriod} 
                  formatPeriodDate={formatPeriodDate}
                  filterType={filterType}
                />
              </div>

              {/* Bar Chart with daily data */}
              <div className="w-full">
                {data.length > 0 ? (
                  <OrderFulfillmentBarChart data={data} />
                ) : (
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm text-center">
                    <p className="text-gray-600 dark:text-gray-400">Not enough historical data to display trends.</p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm">Try selecting a different date range to see more data points.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">
                Hmm, nothing to see here!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We couldn't find any order data for the selected period.
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                Try selecting a different date or time range.
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                <b>January 4th 2025</b> could be a good example
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderFulfillmentDashboard;