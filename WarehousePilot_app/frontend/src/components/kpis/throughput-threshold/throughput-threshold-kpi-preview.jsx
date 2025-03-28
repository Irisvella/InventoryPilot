import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ThroughputBarGraph from "./throughput-graph";
import { parseISO, isAfter, subWeeks, subMonths, subYears } from "date-fns";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ThroughputThresholdKpiPreview() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]); // Data filtered by timeline
    const [range, setRange] = useState("Past Week"); // Default timeline range
    const [isStacked, setIsStacked] = useState(false); // Stack the bars or not

    /* Fetch and format data for ThroughputBarGraph */
    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("No authorization token found");
                setLoading(false);
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/orders/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const formattedData = response.data.map((item) => ({
                date: item.date,
                picked: item.picked,
                packed: item.packed,
                shipped: item.shipped,
            }));

            setData(formattedData);
            setLoading(false);
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    /* Filter data based on the selected range */
    const filterDataByRange = (data, range) => {
        const now = new Date();
        const period = range.trim().split(" ")[1].toLowerCase(); // Extract "week", "month", or "year"

        let startDate;
        if (period === "week") {
            startDate = subWeeks(now, 1);
            setIsStacked(false);
        } else if (period === "month") {
            startDate = subMonths(now, 1);
            setIsStacked(true);
        } else if (period === "year") {
            startDate = subYears(now, 1);
            setIsStacked(true);
        } else {
            throw new Error("Invalid range. Use 'week', 'month', or 'year'.");
        }

        // Filter the data by comparing parsed dates
        return data.filter((item) => {
            const itemDate = parseISO(item.date); // Parse the string date into a Date object
            return itemDate >= startDate && itemDate <= now; // Check if the date is within the range
        });
    };

    /* useEffect - Fetch data on loading component */
    useEffect(() => {
        fetchData();
        if (data.length == 0) { //TODO: Remove this if block after backend is implemented 
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
        }
    }, []);

    // useEffect - Filter data whenever `data` or `range` changes
    useEffect(() => {
        if (data.length > 0) {
            const filtered = filterDataByRange(data, range);
            setFilteredData(filtered);
        }
    }, [data, range]);

    const handleViewDetails = () => {
        navigate("/throughput-threshold");
    };

    const handleRangeClick = (range) => {
        setRange(range);
    };

    return (
        <div className="bg-white p-4 rounded-lg">
            {/* Header and View Details button */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Throughput Threshold</h2>
                <button
                    onClick={handleViewDetails}
                    className="bg-gray-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                >
                    View Details
                </button>
            </div>

            {/* Timeline Range Selector */}
            <div className="flex space-x-2 mb-4">
                {["Past Week", "Past Month", "Past Year"].map((label) => (
                    <button
                        key={label}
                        onClick={() => handleRangeClick(label)}
                        className={`px-4 py-2 rounded ${range === label
                            ? "bg-red-600 text-white"
                            : "bg-gray-200 text-gray-700"
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center">Loading...</div>
            ) : (
                <ThroughputBarGraph data={filteredData} loading={loading} isStacked={isStacked} />
            )}
        </div>
    );
}