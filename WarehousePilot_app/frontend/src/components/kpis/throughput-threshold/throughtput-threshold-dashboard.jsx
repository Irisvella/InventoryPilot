import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from "../../navbar/App";
import SideBar from '../../dashboard_sidebar1/App';
import ThroughputBarGraph from './throughput-graph';
import ThroughputDonutChart from './throughput-current-week-donut-chart';
import ThroughputTable from './throughput-table';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ThroughputThresholdDashboard = ({ userData }) => {
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]); //formatted data for ThroughputBarGraph
    const [donutChartData, setDonutChartData] = useState([]); //formatted data for ThroughputDonutChart

    /* fetchData: fetch and format data for ThroughputBarGraph */
    const fetchData = async () => {
        try {
            // Get authorization token from local storage
            const token = localStorage.getItem("token");
            if (!token) {
                setError("No authorization token found");
                setLoading(false);
                return;
            }

            // Backend API call to get throughput data
            const response = await axios.get(
                `${API_BASE_URL}/orders/`, //TODO: Change this to throughput path
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // Format data for ThroughputBarGraph
            const formattedData = response.data.map((item) => {
                return {
                    date: item.date,
                    picked: item.picked,
                    packed: item.packed,
                    shipped: item.shipped,
                };
            });
            setData(formattedData);
            setLoading(false);
        }
        catch (error) {
            setError(error.message);
        }
    };

    /* formatDataForDonutChart: format data for ThroughputDonutChart component */
    const formatDataForDonutChart = (data) => {
        return [
            { name: 'Picked', value: data.picked },
            { name: 'Packed', value: data.packed },
            { name: 'Shipped', value: data.shipped }
        ];
    };

    /* useEffect - fetch data and set loading state */
    useEffect(() => {
        fetchData();
        if (data.length == 0){ //TODO: Remove this if block after backend is implemented 
            setData([
                { date: '2025-01-01', picked: 450, packed: 350, shipped: 250 },
                { date: '2025-01-08', picked: 520, packed: 420, shipped: 320 },
                { date: '2025-01-15', picked: 580, packed: 480, shipped: 380 },
                { date: '2025-01-22', picked: 620, packed: 520, shipped: 420 },
                { date: '2025-01-29', picked: 680, packed: 580, shipped: 480 },
                { date: '2025-02-05', picked: 720, packed: 620, shipped: 520 },
                { date: '2025-02-12', picked: 650, packed: 550, shipped: 450 },
                { date: '2025-02-19', picked: 590, packed: 490, shipped: 390 },
                { date: '2025-02-26', picked: 630, packed: 530, shipped: 430 },
                { date: '2025-03-05', picked: 690, packed: 590, shipped: 490 },
                { date: '2025-03-12', picked: 750, packed: 650, shipped: 550 },
                { date: '2025-03-19', picked: 820, packed: 720, shipped: 620 },
                { date: '2025-03-26', picked: 780, packed: 680, shipped: 580 },
                { date: '2025-04-02', picked: 710, packed: 610, shipped: 510 },
                { date: '2025-04-09', picked: 670, packed: 570, shipped: 470 },
                { date: '2025-04-16', picked: 730, packed: 630, shipped: 530 },
                { date: '2025-04-23', picked: 790, packed: 690, shipped: 590 },
                { date: '2025-04-30', picked: 850, packed: 750, shipped: 650 },
                { date: '2025-05-07', picked: 880, packed: 780, shipped: 680 },
                { date: '2025-05-14', picked: 820, packed: 720, shipped: 620 },
                { date: '2025-05-21', picked: 760, packed: 660, shipped: 560 },
                { date: '2025-05-28', picked: 810, packed: 710, shipped: 610 },
                { date: '2025-06-04', picked: 870, packed: 770, shipped: 670 },
                { date: '2025-06-11', picked: 920, packed: 820, shipped: 720 },
                { date: '2025-06-18', picked: 950, packed: 850, shipped: 750 },
                { date: '2025-06-25', picked: 890, packed: 790, shipped: 690 },
                { date: '2025-07-02', picked: 830, packed: 730, shipped: 630 },
                { date: '2025-07-09', picked: 780, packed: 680, shipped: 580 },
                { date: '2025-07-16', picked: 840, packed: 740, shipped: 640 },
                { date: '2025-07-23', picked: 910, packed: 810, shipped: 710 },
                { date: '2025-07-30', picked: 970, packed: 870, shipped: 770 },
                { date: '2025-08-06', picked: 1020, packed: 920, shipped: 820 },
                { date: '2025-08-13', picked: 980, packed: 880, shipped: 780 },
                { date: '2025-08-20', picked: 920, packed: 820, shipped: 720 },
                { date: '2025-08-27', picked: 870, packed: 770, shipped: 670 },
                { date: '2025-09-03', picked: 930, packed: 830, shipped: 730 },
                { date: '2025-09-10', picked: 990, packed: 890, shipped: 790 },
                { date: '2025-09-17', picked: 1050, packed: 950, shipped: 850 },
                { date: '2025-09-24', picked: 1100, packed: 1000, shipped: 900 },
                { date: '2025-10-01', picked: 1020, packed: 920, shipped: 820 },
                { date: '2025-10-08', picked: 960, packed: 860, shipped: 760 },
                { date: '2025-10-15', picked: 910, packed: 810, shipped: 710 },
                { date: '2025-10-22', picked: 970, packed: 870, shipped: 770 },
                { date: '2025-10-29', picked: 1030, packed: 930, shipped: 830 },
                { date: '2025-11-05', picked: 1080, packed: 980, shipped: 880 },
                { date: '2025-11-12', picked: 1120, packed: 1020, shipped: 920 },
                { date: '2025-11-19', picked: 1050, packed: 950, shipped: 850 },
                { date: '2025-11-26', picked: 990, packed: 890, shipped: 790 },
                { date: '2025-12-03', picked: 940, packed: 840, shipped: 740 },
                { date: '2025-12-10', picked: 1000, packed: 900, shipped: 800 },
                { date: '2025-12-17', picked: 1070, packed: 970, shipped: 870 },
                { date: '2025-12-24', picked: 1150, packed: 1050, shipped: 950 },
                { date: '2025-12-31', picked: 1200, packed: 1100, shipped: 1000 }
            ]);
            setDonutChartData(formatDataForDonutChart({ date: '2025-03-27', picked: 700, packed: 600, shipped: 500 }));
        }
        else 
            setDonutChartData(formatDataForDonutChart(data[data.length - 1]));
        setLoading(false);
    }, []);

    /* handleViewDetails: navigate to KPI page */
    const handleViewDetails = () => {
        navigate('/kpi');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <SideBar userData={userData} isOpen={isSidebarOpen} />

            {/* Navbar */}
            <div className="flex-1 sm:ml-10 sm:mt-2">
                <NavBar />
            </div>

            {/* Header - Title and Back to KPI Page button*/}
            <div className="flex justify-between items-center mx-10">
                <h1 className="text-3xl font-bold mb-6 dark:text-white">
                    Throughput Threshold Dashboard
                </h1>
                <button
                    className="bg-red-600 dark:bg-red-700 text-white py-1 px-3 rounded hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
                    onClick={handleViewDetails}
                >
                    Back to KPI Overview
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                    <div className="animate-pulse text-gray-600 dark:text-gray-400">Loading data...</div>
                </div>
            ) : (
                <>
                    {/* Donut Chart (This Week's Throughput Threshold) and Associated Orders */}
                    <div className="flex flex-row justify-between sm:ml-10 sm:mt-2 mx-10 space-x-4 mb-4">
                        <div className="flex-1">
                            <ThroughputDonutChart data={donutChartData} />
                        </div>
                        <div className="flex-1">
                            <ThroughputTable data={data}/>
                        </div>
                    </div>

                    {/* Week by week throughput data */}
                    <div className="flex-1 sm:ml-10 sm:mt-2 mx-10">
                        <ThroughputBarGraph 
                            data={data} 
                            loading={loading} 
                            title={'Throughput per Week'} 
                            isStacked={true} 
                            darkMode={true} // Make sure your ThroughputBarGraph component supports dark mode
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export default ThroughputThresholdDashboard;