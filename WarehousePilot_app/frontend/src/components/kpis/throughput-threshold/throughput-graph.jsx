import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import React from 'react';

export default function ThroughputBarGraph({ data, loading, title, isStacked }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      {loading ? (
        <div className="flex justify-center items-center h-64 dark:text-gray-400">
          <div>Loading...</div>
        </div>
      ) : (
        <>
          {title && <h2 className="text-xl font-semibold mb-4 dark:text-white">{title}</h2>}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#9CA3AF' }} 
                stroke="#6B7280"
              />
              <YAxis 
                tick={{ fill: '#9CA3AF' }}
                stroke="#6B7280"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  borderColor: '#374151',
                  color: '#F3F4F6'
                }}
              />
              <Legend />
              <Bar dataKey="picked" fill="#EF4444" stackId={isStacked ? 'a' : null} />
              <Bar dataKey="packed" fill="#F59E0B" stackId={isStacked ? 'a' : null} />
              <Bar dataKey="shipped" fill="#10B981" stackId={isStacked ? 'a' : null} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}