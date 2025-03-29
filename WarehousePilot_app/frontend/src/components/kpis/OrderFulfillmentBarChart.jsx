import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#4CAF50', '#8BC34A', '#FF9800'];

const OrderFulfillmentBarChart = ({ data }) => {
  // Convert raw data into a consistent shape
  const prepareChartData = (periodData) => {
    if (!periodData || !Array.isArray(periodData) || periodData.length === 0) {
      return [];
    }
  
    return periodData.map(period => {
      const started = period.orders_started || 0;
      const full = period.fully_fulfilled || 0;
      const partial = period.partially_fulfilled || 0;
      
      // Calculate each segment ensuring they don't overlap
      const fullyFulfilled = Math.min(full, started);
      const partiallyFulfilled = Math.min(partial, started) - fullyFulfilled;
      const startedOnly = Math.max(0, started - fullyFulfilled - partiallyFulfilled);
      
      const date = new Date(period.period);
      const formattedDate = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      
      return {
        name: formattedDate,
        'Fully Fulfilled': fullyFulfilled,
        'Partially Fulfilled': partiallyFulfilled,
        'Started Only': startedOnly,
        totalStarted: started
      };
    });
  };

  const chartData = prepareChartData(data);

  // For single data point, normalize as fractions
  const finalData = chartData.length === 1
    ? chartData.map(item => {
        const total = item.totalStarted || 1; // Avoid division by zero
        return {
          ...item,
          "Fully Fulfilled": item["Fully Fulfilled"] / total,
          "Partially Fulfilled": item["Partially Fulfilled"] / total,
          "Started Only": item["Started Only"] / total,
        };
      })
    : chartData;

  // Stack props for multiple data points
  const stackProps = chartData.length > 1 ? { stackOffset: "expand" } : {};

  // Modified tooltip to show only count values (no percentages)
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const totalStarted = payload[0].payload.totalStarted || 0;

    return (
      <div className="bg-white dark:bg-gray-700 p-2 border border-gray-200 dark:border-gray-600 shadow-sm rounded text-gray-800 dark:text-gray-200">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => {
          // Get the actual count based on whether we're using normalized data
          const fraction = entry.value;
          const rawCount = chartData.length === 1 
            ? Math.round(fraction * totalStarted) 
            : Math.round(entry.value * 100) / 100;

          return (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {rawCount}
            </p>
          );
        })}
        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
          Total Started: {totalStarted}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-700/50">
      <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">Order Fulfillment Trend</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={finalData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            {...stackProps}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" strokeOpacity={0.3} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#6B7280' }} 
              stroke="#6B7280"
            />
            <YAxis 
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} 
              tick={{ fill: '#6B7280' }}
              stroke="#6B7280"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{
                color: '#6B7280'
              }}
            />
            <Bar dataKey="Fully Fulfilled" stackId="a" fill={COLORS[0]} />
            <Bar dataKey="Partially Fulfilled" stackId="a" fill={COLORS[1]} />
            <Bar dataKey="Started Only" stackId="a" fill={COLORS[2]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OrderFulfillmentBarChart;