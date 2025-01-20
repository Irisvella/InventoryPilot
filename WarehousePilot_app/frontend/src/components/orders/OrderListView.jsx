import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Pagination,
  Button,
} from "@nextui-org/react"; // Importing necessary components from NextUI for the table and buttons
import { SearchIcon } from "@nextui-org/shared-icons"; // Importing SearchIcon from NextUI shared icons
import axios from "axios"; // Importing Axios for making HTTP requests
import SideBar from "../dashboard_sidebar1/App";
import Header from "../dashboard_sidebar/Header";
import { useNavigate } from "react-router-dom"; // Importing Header component

// ---- NEW IMPORTS FOR TIMEZONE HANDLING ----
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Extend dayjs with UTC and timezone
dayjs.extend(utc);
dayjs.extend(timezone);

const OrderListView = () => {
  // State variables
  const [filterValue, setFilterValue] = useState(""); // Filter value for search functionality
  const [rows, setRows] = useState([]); // To store the list of orders fetched from the backend
  const [loading, setLoading] = useState(true); // To manage loading state
  const [error, setError] = useState(null); // To store any error message
  const [successOrderStart, setSuccessOrderStart] = useState(null); // Success message for starting the order
  const [successListGeneration, setSuccessListGeneration] = useState(null); // Success message for list generation
  const [page, setPage] = useState(1); // Page number for pagination
  const [isSidebarOpen, setSidebarOpen] = useState(false); // To toggle the sidebar visibility
  const [userData, setUserData] = useState(null); // To store user data
  const [updatingOrderId, setUpdatingOrderId] = useState(null); // To track which order is being updated
  const navigate = useNavigate();
  const rowsPerPage = 10; // Number of rows to display per page

  // Filter rows based on search text (order ID, duration, status, due date)
  const filteredRows = useMemo(() => {
    if (!filterValue.trim()) return rows;
    const searchTerm = filterValue.toLowerCase();
    return rows.filter((row) => {
      const orderIdMatch = row.order_id
        ?.toString()
        .toLowerCase()
        .includes(searchTerm);
      const durationMatch = row.estimated_duration
        ?.toString()
        .toLowerCase()
        .includes(searchTerm);
      const statusMatch = row.status?.toLowerCase().includes(searchTerm);
      const dueDateMatch = row.due_date?.toLowerCase().includes(searchTerm);
      return orderIdMatch || durationMatch || statusMatch || dueDateMatch;
    });
  }, [rows, filterValue]);

  // Sort rows so that "In Progress" items appear at the top
  const sortedFilteredRows = useMemo(() => {
    const rowsCopy = [...filteredRows];
    rowsCopy.sort((a, b) => {
      if (a.status === "In Progress" && b.status !== "In Progress") {
        return -1;
      }
      if (a.status !== "In Progress" && b.status === "In Progress") {
        return 1;
      }
      return 0;
    });
    return rowsCopy;
  }, [filteredRows]);

  // Apply pagination to the filtered rows
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedFilteredRows.slice(start, end);
  }, [page, sortedFilteredRows]);

  // Calculate total pages based on the number of filtered rows
  const totalPages = Math.ceil(sortedFilteredRows.length / rowsPerPage);

  // Fetch orders data from the backend
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        "http://127.0.0.1:8000/orders/ordersview/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setRows(
        response.data.map((row, index) => ({
          id: index + 1,
          order_id: row.order_id,
          estimated_duration: row.estimated_duration,
          status: row.status,
          due_date: row.due_date,
          start_timestamp: row.start_timestamp, // store the start timestamp here
        }))
      );
      setLoading(false);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to fetch orders");
      setLoading(false);
    }
  };

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Auto-dismiss success message for starting the order after 3 seconds
  useEffect(() => {
    if (successOrderStart) {
      const timer = setTimeout(() => {
        setSuccessOrderStart(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successOrderStart]);

  // Auto-dismiss success message for generating lists after 3 seconds
  useEffect(() => {
    if (successListGeneration) {
      const timer = setTimeout(() => {
        setSuccessListGeneration(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successListGeneration]);

  // Handle the start button click event
  const handleStart = async (orderId) => {
    try {
      setUpdatingOrderId(orderId);
      setError(null);
      setSuccessOrderStart(null); // Reset previous success message

      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authorization token found");
        return;
      }

      // Send POST request to start the order
      const response = await axios.post(
        `http://127.0.0.1:8000/orders/start_order/${orderId}/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response from backend (start_order):", response.data);

      if (response.data.status === "success") {
        // Update the order status and start timestamp
        setRows((prevRows) =>
          prevRows.map((row) =>
            row.order_id === orderId
              ? {
                  ...row,
                  status: response.data.order_status,
                  start_timestamp: response.data.start_timestamp,
                }
              : row
          )
        );
        setSuccessOrderStart(`Order ${orderId} successfully started!`);

        // Second POST request to generate the list (after starting the order)
        const generateListsResponse = await axios.post(
          "http://127.0.0.1:8000/orders/generateLists/",
          { orderID: orderId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(
          "Response from backend (generateLists):",
          generateListsResponse.data
        );

        if (generateListsResponse.data.detail) {
          setSuccessListGeneration(generateListsResponse.data.detail);
        }
      } else {
        setError(`Error: ${response.data.message}`);
      }
    } catch (err) {
      console.error("Error starting the order:", err);
      if (err.response) {
        setError(
          `Error: ${err.response.data.message || "Unknown error occurred"}`
        );
      } else {
        setError("Error starting the order");
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="flex h-full">
      <SideBar />

      <div className="flex-1">
        <div className="mt-16 p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-row gap-11">
              <h1 className="text-2xl font-bold mb-6">Orders</h1>

              <Button
                color="primary"
                variant="flat"
                onClick={() =>
                  navigate("/inventory_and_manufacturing_picklist")
                }
              >
                Inventory and Manufacturing List
              </Button>
            </div>
            {/* Success message for starting the order */}
            {successOrderStart && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex justify-between items-center">
                <span>{successOrderStart}</span>
                <button
                  onClick={() => setSuccessOrderStart(null)}
                  className="bg-transparent text-green-700 hover:text-green-900 font-semibold px-2"
                >
                  ×
                </button>
              </div>
            )}

            {/* Success message for generating the lists */}
            {successListGeneration && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex justify-between items-center">
                <span>{successListGeneration}</span>
                <button
                  onClick={() => setSuccessListGeneration(null)}
                  className="bg-transparent text-green-700 hover:text-green-900 font-semibold px-2"
                >
                  ×
                </button>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex justify-between items-center">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="bg-transparent text-red-700 hover:text-red-900 font-semibold px-2"
                >
                  ×
                </button>
              </div>
            )}

            {/* Search Input */}
            <div className="mb-6 flex items-center gap-2">
              <Input
                size="md"
                placeholder="Search orders"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                endContent={
                  <SearchIcon className="text-default-400" width={16} />
                }
                className="w-72"
              />
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div>Loading...</div>
              </div>
            ) : (
              <>
                <Table aria-label="Order list" className="min-w-full">
                  <TableHeader>
                    <TableColumn>Order ID</TableColumn>
                    <TableColumn>Estimated Duration</TableColumn>
                    <TableColumn>Status</TableColumn>
                    <TableColumn>Due Date</TableColumn>
                    {/* New Start Date column */}
                    <TableColumn>Start Date</TableColumn>
                    <TableColumn>Action</TableColumn>
                  </TableHeader>

                  <TableBody items={paginatedRows}>
                    {(item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.order_id}</TableCell>
                        <TableCell>{item.estimated_duration}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded ${
                              item.status === "In Progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-gray-800" // Default styling for other statuses
                            }`}
                          >
                            {item.status || "Not Started"}{" "}
                            {/* Fallback if status is undefined */}
                          </span>
                        </TableCell>
                        <TableCell>{item.due_date}</TableCell>
                        {/* Convert UTC timestamp to Eastern time zone */}
                        <TableCell>
                          {item.start_timestamp
                            ? dayjs
                                .utc(item.start_timestamp)
                                .tz("America/Toronto")
                                .format("YYYY-MM-DD HH:mm")
                            : ""}
                        </TableCell>
                        <TableCell>
                          <Button
                            color={
                              item.status === "In Progress"
                                ? "success"
                                : "primary"
                            }
                            size="sm"
                            isDisabled={
                              item.status === "In Progress" ||
                              updatingOrderId !== null
                            }
                            onPress={() => handleStart(item.order_id)}
                          >
                            {item.status === "In Progress"
                              ? "Started"
                              : "Start"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <div className="flex justify-between items-center mt-4">
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <Pagination
                    total={totalPages}
                    initialPage={1}
                    current={page}
                    onChange={(newPage) => setPage(newPage)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderListView;
