import React, { useEffect, useState } from "react";
import axios from "axios";
// import Sidebar from "../dashboard_sidebar/Sidebar";
import Header from "../dashboard_sidebar/Header";
import UsersTable from "./UsersTable";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import SideBar from "../dashboard_sidebar1/App";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ManageUsersPage() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [staffAmount, setStaffAmount] = useState(0);
    const navigate = useNavigate();

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    // Retrieve the current user's data
    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await axios.get(`${API_BASE_URL}/auth/profile/`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setUserData(response.data);
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        };
        fetchUserData();
    }, []);

    return (
        <div className="h-full">

            {/* Main Content */}
            <div className="flex-1 ">
                <SideBar />
    

                <main className="flex p-6 h-screen justify-center ">
                    {/* Cards Container */}
                    <div className="flex flex-col m-auto w-full max-w-7xl">
                        <Box
                            className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-gray-300 rounded-md mb-5"
                            sx={{
                                width: "100%",
                                bgcolor: "rgb(255 255 255 / var(--tw-bg-opacity, 1))",
                                fontSize: "0.875rem",
                                fontWeight: "700",
                            }}
                        >
                            <Button variant="contained" color="success" href="/admin_dashboard/add_users">
                                Add new staff
                            </Button>
                            <h2 className="text-lg font-bold">Total number of staff: {staffAmount}</h2>
                        </Box>
                        <UsersTable onStaffCountChange={setStaffAmount} />
                    </div>
                </main>
            </div>
        </div>
    );
};