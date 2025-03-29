import React from 'react';

const OrderFulfillmentTable = ({ currentPeriod, formatPeriodDate, filterType }) => {
  // Function to prepare stats data
  const prepareStatsData = (periodData) => {
    if (!periodData) return [];
    
    const total = periodData.total_orders_count || 0;
    const fullyFulfilled = periodData.fully_fulfilled || 0;
    const partiallyFulfilled = periodData.partially_fulfilled || 0;
    const ordersStarted = periodData.orders_started || 0;
    const startedOnly = Math.max(0, ordersStarted - partiallyFulfilled - fullyFulfilled);
    const notStarted = Math.max(0, total - ordersStarted);

    return [
      { name: 'Total Orders', value: total },
      { name: 'Total Orders started', value: periodData.orders_started ,percent:'-'},
      { 
        name: 'Fully Fulfilled', 
        value: fullyFulfilled, 
        percent: total > 0 ? ((fullyFulfilled / total) * 100).toFixed(1) : '0.0' 
      },
      { 
        name: 'Partially Fulfilled', 
        value: partiallyFulfilled, 
        percent: total > 0 ? ((partiallyFulfilled / total) * 100).toFixed(1) : '0.0' 
      },
      { 
        name: 'Started Only', 
        value: startedOnly,
        percent: total > 0 ? ((startedOnly / total) * 100).toFixed(1) : '0.0'
      },
      { 
        name: 'Not Started', 
        value: notStarted,
        percent: total > 0 ? ((notStarted / total) * 100).toFixed(1) : '0.0'
      }
    ];
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-700/50">
      <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
        Order Fulfillment Statistics
      </h3>
      <div className="overflow-hidden">
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Period: <span className="font-medium dark:text-gray-300">{formatPeriodDate(currentPeriod.period)}</span>
        </p>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-gray-800 dark:text-gray-300">
                Status
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-gray-800 dark:text-gray-300">
                Count
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-gray-800 dark:text-gray-300">
                Percentage
              </th>
            </tr>
          </thead>
          <tbody>
            {prepareStatsData(currentPeriod).map((entry, index) => (
              <tr 
                key={index} 
                className={index === 0 ? "font-semibold bg-gray-50 dark:bg-gray-700" : ""}
              >
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-800 dark:text-gray-300">
                  {entry.name}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-gray-800 dark:text-gray-300">
                  {entry.value}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-gray-800 dark:text-gray-300">
                  {index === 0 || index === 1 ? '-' : `${entry.percent}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderFulfillmentTable;