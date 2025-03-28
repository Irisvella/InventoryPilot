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
      const date = new Date(entry.date);
      const formattedDate = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

      return {
        name: formattedDate,
        "Average Cycle Time": entry.avg_cycle_time,
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
            <Bar dataKey="Average Cycle Time" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CycleTimeBarChart;