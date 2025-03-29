import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import axios from 'axios';

const COLORS = ["#950606", "#ca3433"];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const OrderPickingAccuracy = () => {
  const [data, setData] = useState([
    { name: "Accurate Picks", value: 0 },
    { name: "Inaccurate Picks", value: 0 },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accuracyPercentage, setAccuracyPercentage] = useState(0);
  const [totalPicks, setTotalPicks] = useState(0);
  const [targetAccuracy] = useState(99);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/kpi_dashboard/order-picking-accuracy/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = response.data;// Use response.data for axios
        // console.log(result)
         // Update the data state
        const accurate = result.inaccurate_picks || 0; //they were fetched in the inverse order so I fixed them here
        const inaccurate = result.accurate_picks || 0;
        const total = accurate + inaccurate;

        setData([
          { name: "Accurate Picks", value: accurate },
          { name: "Inaccurate Picks", value: inaccurate },
        ]);

        setTotalPicks(total);
        setAccuracyPercentage(total > 0 ? ((accurate / total) * 100).toFixed(1) : 0);

      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  // Calculate the accuracy percentage
  // const totalPicks = data[0].value + data[1].value;
  // const accuracyPercentage = totalPicks > 0 ? ((data[0].value / totalPicks) * 100).toFixed(2) : 0;

  return (
    <div className="flex flex-col">
      {/* Title and Button on the same line */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Picking Accuracy</h2>
        <button
          onClick={() => navigate('/order-picking')}
          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          View Details
        </button>
      </div>

      <div>
        <p className="text-3xl font-bold">{totalPicks.toLocaleString()}</p>
        <p className={`${accuracyPercentage >= targetAccuracy ? 'text-green-500' : 'text-red-500'}`}>
          {accuracyPercentage}%
        </p>
      </div>

      <div className="bg-transparent">
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : (
          <>
          {/* Chart */}
            <PieChart width={300} height={200}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#950606"
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderPickingAccuracy;



