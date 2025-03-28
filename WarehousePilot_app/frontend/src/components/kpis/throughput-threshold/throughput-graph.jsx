import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import React from 'react';

export default function ThroughputBarGraph({ data, loading, title, isStacked }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div>Loading...</div>
        </div>
      ) : (
        <>
          {/* Optional Title */}
          { title ? (<h2 className="text-xl font-semibold mb-4">{title}</h2>) : null }
          <ResponsiveContainer width="100%" height={300}>
            {/* Bar Chart */}
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="picked" fill="#FF6B6B" stackId={isStacked ? 'a' : null} /> {/* TODO: Change colors */}
              <Bar dataKey="packed" fill="#FFA94D" stackId={isStacked ? 'a' : null} />
              <Bar dataKey="shipped" fill="#FFD66B" stackId={isStacked ? 'a' : null} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}