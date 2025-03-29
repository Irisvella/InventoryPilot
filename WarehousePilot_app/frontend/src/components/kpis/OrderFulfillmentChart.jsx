import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip, Legend
} from 'recharts';

const COLORS = ['#4CAF50', '#8BC34A', '#FF9800'];

const OrderFulfillmentChart = ({ currentPeriod }) => {
  // Function to prepare data for the donut chart
  const prepareChartData = (periodData) => {
    if (!periodData) return [];
    
    const startedOrders = periodData.orders_started || 0;
    const startedOnly = Math.max(0, startedOrders - 
                              (periodData.partially_fulfilled || 0) - 
                              (periodData.fully_fulfilled || 0));
    
    return [
      { 
        name: 'Fully Fulfilled', 
        value: periodData.fully_fulfilled || 0, 
        percent: startedOrders ? ((periodData.fully_fulfilled / startedOrders) * 100).toFixed(1) : '0.0',
        count: periodData.fully_fulfilled || 0
      },
      { 
        name: 'Partially Fulfilled', 
        value: periodData.partially_fulfilled || 0, 
        percent: startedOrders ? ((periodData.partially_fulfilled / startedOrders) * 100).toFixed(1) : '0.0',
        count: periodData.partially_fulfilled || 0
      },
      { 
        name: 'Started Only', 
        value: startedOnly,
        percent: startedOrders ? ((startedOnly / startedOrders) * 100).toFixed(1) : '0.0',
        count: startedOnly
      }
    ];
  };

  // Custom tooltip to display both percentage and count
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-700 p-2 border border-gray-200 dark:border-gray-600 shadow-sm rounded text-gray-800 dark:text-gray-200">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p>Count: {payload[0].payload.count}</p>
          <p>Percentage: {payload[0].payload.percent}%</p>
        </div>
      );
    }
    return null;
  };

  // Custom label to display percentage
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const chartData = prepareChartData(currentPeriod);
    if (parseFloat(chartData[index].percent) < 5) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${chartData[index].percent}%`}
      </text>
    );
  };

  const chartData = prepareChartData(currentPeriod);
  const startedOrders = currentPeriod?.orders_started || 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-700/50">
      <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">Started Orders Breakdown</h3>
      <div className="text-center mb-2">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {startedOrders.toLocaleString()}
        </div>
        <div className="text-gray-500 dark:text-gray-400">Started Orders</div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={chartData} 
              cx="50%" 
              cy="50%" 
              innerRadius={60} 
              outerRadius={100} 
              fill="#8884d8" 
              dataKey="value"
              labelLine={false}
              label={renderCustomizedLabel}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right"
              formatter={(value, entry, index) => {
                return (
                  <span className="text-sm text-gray-800 dark:text-gray-300">
                    {value}: {chartData[index].percent}%
                  </span>
                );
              }}
              wrapperStyle={{
                color: '#6B7280' // This ensures legend text is visible in both modes
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OrderFulfillmentChart;