import React, { useState } from "react";
import Header from "../dashboard_sidebar/Header";
import CycleTime from "./CycleTime";
import OrderPickingAccuracy from "./OrderPickingAccuracy";
import StockLevels from "./StockLevels";
import WarehouseThroughput from "./WarehouseThroughput";
import OrderFulfillmentRate from "./OrderFulfillmentRate";
import StockLevelsPreview from "./StockLevelsPreview";
import SideBar from "../dashboard_sidebar1/App";
import NavBar from "../navbar/App";
const KPIDashboard = ({ userData }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div style={{ marginTop: "-80px", backgroundColor:'#F4F4F5' }}>
    <NavBar />
    <SideBar /> {/* Add the SideBar component here */}
    {/* <div className="flex-1 flex flex-col " > */}
      {/* Main Content
      <div className="flex-1 flex flex-col"> */}
        {/* KPI Dashboard Content */}
        <main className="flex-1 flex flex-col p-6 mt-8">
          {/* Title */}
          <h1 className=" mt-12 sm:text-xl font-bold text-center mb-6">KPI Dashboard</h1>

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
      {/* </div> */}
    // </div>
  );
};

export default KPIDashboard;