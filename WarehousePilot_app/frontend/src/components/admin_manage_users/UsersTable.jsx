import React, { useEffect, useState } from "react";
import axios from "axios";
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Pagination defaults
const DEFAULT_PAGINATION = {
    page: 0,
    pageSize: 15,
};

export default function UsersTable({ onStaffCountChange }) {
    const [allUsers, setAllUsers] = useState([]); // Raw user data from the backend API
    const [staffData, setStaffData] = useState([]); // Formatted data for the table component, DataGrid

    // Function to fetch user data from the backend API
    const fetchData = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin_dashboard/manage_users`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setAllUsers(response.data); // Store the raw data
            onStaffCountChange(response.data.length); // Notify parent of staff count
            console.log('User data has been retrieved successfully');
        } catch (error) {
            console.error('Getting users failed:', error);
            alert("Couldn't get users");
        }
    };

    // Handle delete action
    const deleteUser = async (user_id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/admin_dashboard/delete_user/${user_id}/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            alert(response.data.message);
            fetchData(); // Refresh data after deletion
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert("Couldn't delete the user.");
        }
    };

    // Confirm deletion action
    const confirmDelete = (user_id) => {
        if (window.confirm(`Are you sure you want to delete user with ID ${user_id}?`)) {
            deleteUser(user_id);
        }
    };

    // Define table columns
    const STAFF_COLUMNS = [
        { field: 'id', headerName: 'No.', width: 100, type: 'number' },
        { field: 'firstName', headerName: 'First Name', width: 180 },
        { field: 'lastName', headerName: 'Last Name', width: 180 },
        { field: 'staffId', headerName: 'Staff ID', width: 130 },
        { field: 'email', headerName: 'Email', width: 230 },
        { field: 'role', headerName: 'Role', width: 130 },
        { field: 'department', headerName: 'Department', width: 130 },
        {
            field: 'delete',
            headerName: 'Action',
            renderCell: (cellValues) => (
                <Button
                    variant="text"
                    color="secondary"
                    onClick={() => confirmDelete(cellValues.row.staffId)}
                >
                    Delete
                </Button>
            ),
            width: 150,
        },
    ];

    // Formatting data when the value of "allUsers" changes
    useEffect(() => {
        const formattedData = allUsers.map((user, index) => ({
            id: index + 1, // Unique identifier for DataGrid
            firstName: user.first_name,
            lastName: user.last_name,
            staffId: user.user_id,
            email: user.email,
            role: user.role,
            department: user.department,
        }));
        setStaffData(formattedData);
    }, [allUsers]);

    // Fetch data on component mount
    useEffect(() => {
        fetchData();
    }, []);

    // Storing for use in the Manage Users Page
    localStorage.setItem('staffAmount', allUsers.length);

    return (
        <Paper
            elevation={2}
            sx={{
                height: 800,
                width: '100%',
                borderRadius: '8px',
                overflow: 'hidden',
            }}
        >
            <DataGrid
                rows={staffData}
                columns={STAFF_COLUMNS}
                initialState={{
                    pagination: { paginationModel: DEFAULT_PAGINATION },
                }}
                pageSizeOptions={[15]}
                rowHeight={45}
                checkboxSelection
                disableRowSelectionOnClick
                sx={{
                    border: 0,
                    '& .MuiDataGrid-cell:focus': {
                        outline: 'none',
                    },
                }} />
        </Paper>
    );
}