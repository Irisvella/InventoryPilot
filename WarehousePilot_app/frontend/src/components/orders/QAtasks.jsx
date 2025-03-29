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
  Checkbox,
} from "@heroui/react";
import { SearchIcon } from "@heroui/shared-icons";
import axios from "axios";
import SideBar from "../dashboard_sidebar1/App";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import NavBar from "../navbar/App";
dayjs.extend(utc);
dayjs.extend(timezone);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const QATasks = () => {
  const [filterValue, setFilterValue] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // New state variables for functional filters
  const [prodQaFilter, setProdQaFilter] = useState("all");
  const [paintQaFilter, setPaintQaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState("");

  // Fetch QA tasks from the backend.
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found");
        setLoading(false);
        return;
      }
      const response = await axios.get(
        `${API_BASE_URL}/qa_dashboard/qa_tasks/`,
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
          manufacturing_task_id: row.manufacturing_task_id,
          qty: row.qty,
          status: row.status.toLowerCase(), // e.g. "in progress", "completed", "error"
          sku_color: row.sku_color_id,
          due_date: row.due_date || "N/A",
          prod_qa: row.prod_qa, // "completed" or "pending"
          paint_qa: row.paint_qa, // "completed" or "pending"
          final_qa: row.final_qa,
        }))
      );
      setLoading(false);
    } catch (err) {
      console.error("Error fetching QA tasks:", err);
      setError("Failed to fetch QA tasks");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Update Production & Paint QA statuses.

  const handleUpdate = async (taskId, prodQaValue, paintQaValue) => {
    try {
      await axios.post(
        `${API_BASE_URL}/qa_dashboard/qa_tasks/update/`,
        {
          manufacturing_task_id: taskId,
          prod_qa: prodQaValue,
          paint_qa: paintQaValue,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      fetchTasks();
    } catch (error) {
      console.error("Error updating QA task:", error);
    }
  };

  const handleErrorFixed = async (taskId) => {
    try {
      const payload = {
        manufacturing_task_id: taskId,
        status: "in progress", // When error is fixed, status is reset to "in progress".
      };
      await axios.post(
        `${API_BASE_URL}/qa_dashboard/qa_tasks/update_status/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      fetchTasks();
      alert("Error status updated to 'in progress'");
    } catch (error) {
      console.error("Error updating status:", error.response?.data || error.message);
      alert("Failed to update the error status");
    }
  };

  const handleReportError = async (taskId) => {
    const subject = prompt("Enter the subject of the error:", "Defect Found");
    if (subject == null) return;
    const comment = prompt("Enter additional details:", "Describe the issue...");
    if (comment == null) return;
    try {
      await axios.post(
        `${API_BASE_URL}/qa_dashboard/qa_tasks/report_error/`,
        {
          manufacturing_task_id: taskId,
          subject,
          comment,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      alert("Error reported successfully");
      fetchTasks();
    } catch (error) {
      console.error("Error reporting QA error:", error);
      alert("Failed to report error");
    }
  };

  const handleFinalQACheck = async (taskId) => {
    const confirmed = window.confirm("Are you sure you want to send this task to Pick & Pack?");
    if (confirmed) {
      try {
        await axios.post(
          `${API_BASE_URL}/qa_dashboard/send_to_pick_and_pack/`,
          { manufacturing_task_id: taskId },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        alert("Task marked as completed (Final QA done).");
        fetchTasks();
      } catch (error) {
        console.error("Error sending task to Final QA:", error.response?.data || error.message);
        alert("Failed to mark task as completed");
      }
    }
  };

  // Function to clear all filters
  const clearFilters = () => {
    setFilterValue("");
    setProdQaFilter("all");
    setPaintQaFilter("all");
    setStatusFilter("all");
    setDueDateFilter("");
  };

  // Filter rows by search text and additional functional filters.
  const filteredRows = useMemo(() => {
    let filtered = rows;
    if (prodQaFilter !== "all") {
      filtered = filtered.filter((row) => row.prod_qa === prodQaFilter);
    }
    if (paintQaFilter !== "all") {
      filtered = filtered.filter((row) => row.paint_qa === paintQaFilter);
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((row) => row.status === statusFilter);
    }
    if (dueDateFilter) {
      filtered = filtered.filter(
        (row) =>
          row.due_date !== "N/A" &&
          dayjs(row.due_date).format("YYYY-MM-DD") === dueDateFilter
      );
    }
    if (filterValue.trim()) {
      const searchTerm = filterValue.toLowerCase();
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) =>
          value?.toString().toLowerCase().includes(searchTerm)
        )
      );
    }
    return filtered;
  }, [rows, filterValue, prodQaFilter, paintQaFilter, statusFilter, dueDateFilter]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredRows.slice(start, end);
  }, [page, filteredRows]);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  return (
    <div className="dark:bg-gray-900 min-h-screen" style={{ marginTop: "-80px" }}>
      <NavBar />
      <SideBar />
      <div className="flex-1 p-6 mt-8 dark:bg-gray-900" style={{ padding: "40px" }}>
        <div className="flex-1">
          <div className="mt-4 p-8">
            <div className="flex flex-col gap-6">
              <h1 className="text-2xl font-bold mb-6 dark:text-white">QA Tasks</h1>
              {error && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              {/* Filter row with clear filters button */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <Input
                  size="md"
                  placeholder="Search tasks"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  endContent={<SearchIcon className="text-gray-500 dark:text-gray-400" width={16} />}
                  className="w-72 rounded border-gray-300 dark:border-gray-600 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800  dark:text-white"
                />
                <select
                  value={prodQaFilter}
                  onChange={(e) => setProdQaFilter(e.target.value)}
                  className="p-2 border rounded border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Production QA</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
                <select
                  value={paintQaFilter}
                  onChange={(e) => setPaintQaFilter(e.target.value)}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Paint QA</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="in progress">In Progress</option>
                  <option value="error">Error</option>
                  <option value="pick and pack">Pick and Pack</option>
                </select>
                <input
                  type="date"
                  value={dueDateFilter}
                  onChange={(e) => setDueDateFilter(e.target.value)}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 dark:bg-gray-700 dark:text-white"
                />
                <Button
                  size="sm"
                  onClick={clearFilters}
                  className="rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                  Clear Filters
                </Button>
              </div>
              {loading ? (
                <div className="flex justify-center items-center h-64 text-gray-600 dark:text-gray-400 text-xl">
                  Loading...
                </div>
              ) : (
                <>
                  <Table
                    aria-label="QA tasks"
                    className="min-w-full bg-white dark:bg-transparent rounded-lg overflow-hidden shadow-md"
                  >
                    <TableHeader>
                      <TableColumn className="dark:text-white">Task ID</TableColumn>
                      <TableColumn className="dark:text-white">Qty</TableColumn>
                      <TableColumn className="dark:text-white">SKU ID</TableColumn>
                      <TableColumn className="dark:text-white">Due Date</TableColumn>
                      <TableColumn className="dark:text-white">Production QA</TableColumn>
                      <TableColumn className="dark:text-white">Paint QA</TableColumn>
                      <TableColumn className="dark:text-white">Actions</TableColumn>
                      <TableColumn className="dark:text-white">Status</TableColumn>
                      <TableColumn className="dark:text-white">Final QA</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {paginatedRows.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <TableCell className="dark:text-white">{item.manufacturing_task_id}</TableCell>
                          <TableCell className="dark:text-white">{item.qty}</TableCell>
                          <TableCell className="dark:text-white">{item.sku_color}</TableCell>
                          <TableCell className="dark:text-white">
                            {item.due_date !== "N/A"
                              ? dayjs(item.due_date).format("YYYY-MM-DD")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              color="success"
                              isSelected={item.prod_qa === "completed"}
                              onValueChange={(isSelected) => {
                                const newProdQa = isSelected ? "completed" : "pending";
                                handleUpdate(item.manufacturing_task_id, newProdQa, item.paint_qa);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              color="success"
                              isSelected={item.paint_qa === "completed"}
                              onValueChange={(isSelected) => {
                                const newPaintQa = isSelected ? "completed" : "pending";
                                handleUpdate(item.manufacturing_task_id, item.prod_qa, newPaintQa);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="flat"
                                color="danger"
                                onClick={() => handleReportError(item.manufacturing_task_id)}
                                className="rounded dark:bg-red-700 dark:text-white"
                              >
                                Report Error
                              </Button>
                              {item.status === "error" && (
                                <Button
                                  size="sm"
                                  variant="flat"
                                  color="success"
                                  onClick={() => handleErrorFixed(item.manufacturing_task_id)}
                                  className="rounded dark:bg-green-700 dark:text-white"
                                >
                                  Error Reported
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="dark:text-white">{item.status}</TableCell>
                          <TableCell>
                            <Checkbox
                              color="success"
                              isSelected={item.status === "pick and pack"}
                              onValueChange={(isSelected) => {
                                if (isSelected) {
                                  handleFinalQACheck(item.manufacturing_task_id);
                                }
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-between items-center mt-6">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {page} of {totalPages}
                    </span>
                    <Pagination
                      total={totalPages}
                      initialPage={1}
                      current={page}
                      onChange={(newPage) => setPage(newPage)}
                      className="text-gray-600 dark:text-gray-400"
                      classNames={{
                        item: "dark:bg-gray-700 dark:text-white",
                        cursor: "dark:bg-gray-600 dark:text-white"
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QATasks;