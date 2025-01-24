import React, { useState } from "react";
// import Sidebar from "../dashboard_sidebar/Sidebar";
import Header from "../dashboard_sidebar/Header";
import CycleTime from "./CycleTime";
import OrderPickingAccuracy from "./OrderPickingAccuracy";
import StockLevels from "./StockLevels";
import WarehouseThroughput from "./WarehouseThroughput";
import OrderFulfillmentRate from "./OrderFulfillmentRate";
import StockLevelsPreview from "./StockLevelsPreview";


import SideBar from "../dashboard_sidebar1/App";

const KPIDashboard = ({ userData }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex bg-gray-100">
      {/* Sidebar */}
      <SideBar userData={userData} isOpen={isSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 sm:ml-10 sm:mt-5">

        {/* KPI Dashboard Content */}
        <main className="p-6 bg-gray-100 h-screen">
          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-6">KPI Dashboard</h1>

          {/* Cards Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CycleTime />
            <OrderPickingAccuracy />
            <StockLevels />
            <WarehouseThroughput />
            <OrderFulfillmentRate />
            <StockLevels />
          </div>
        </main>
      </div>
    </div>
  );
};

export default KPIDashboard;

