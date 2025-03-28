import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import React from 'react';

export default function ThroughputDonutChart({ data }) {
    const COLORS = ['#FF6B6B', '#FFA94D', '#FFD66B'];

    const total = data.reduce((acc, cur) => acc + cur.value, 0);

    /* Custom tooltip to display count */
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-2 border border-gray-200 shadow-sm rounded">
                    <p className="font-medium">{payload[0].name}</p>
                    <p>Count: {payload[0].value}</p>
                    <p>Percentage: {Math.round((payload[0].value / total) * 100)}%</p>
                </div>
            );
        }
        return null;
    };

    /* Custom label to display percentage */
    const customLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, payload }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
            >
                {payload.value}
            </text>
        );
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">This Week's Throughput Threshold</h2>
            <ResponsiveContainer width="100%" height={310}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={customLabel}
                        labelLine={false}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" align="center" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}