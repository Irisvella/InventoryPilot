import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CycleTimeBarChart = ({ data }) => {
  // Prepare the chart data
  const prepareChartData = (cycleTimeData) => {
    if (!cycleTimeData || !Array.isArray(cycleTimeData) || cycleTimeData.length === 0) {
      return [];
    }

    return cycleTimeData.map((entry) => {
      const date = new Date(`${entry.day}T00:00:00Z`);

      // Format date to shorthand
      const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(date);

      return {
        name: formattedDate,
        picked: entry.picked,
        packed: entry.packed,
        shipped: entry.shipped,
      };
    });
  };

  const chartData = prepareChartData(data);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Cycle Time Per Order</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="picked" stackId="a" fill="#4CAF50" />
            <Bar dataKey="packed" stackId="a" fill="#FF9800" />
            <Bar dataKey="shipped" stackId="a" fill="#2196F3" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CycleTimeBarChart;