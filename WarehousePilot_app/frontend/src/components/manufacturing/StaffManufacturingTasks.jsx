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
  Modal,
  Dropdown,
} from "@nextui-org/react";
import { SearchIcon } from "@nextui-org/shared-icons";
import axios from "axios";
import SideBar from "../dashboard_sidebar1/App";
import Header from "../dashboard_sidebar/Header";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import NavBar from "../navbar/App";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

dayjs.extend(utc);
dayjs.extend(timezone);

const StaffManufacturingTasks = () => {
  const [filterValue, setFilterValue] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [isCompleteLoading, setIsCompleteLoading] = useState({}); // Track loading per task
  const [nextStage, setNextStage] = useState("welding"); // Default to welding for cutting stage

  const rowsPerPage = 10;

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/staff_dashboard/staff_manufacturing_tasks/`,
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
          manufacturing_id: row.manufacturing_id,
          qty: row.qty,
          status: row.status,
          sku_color: row.sku_color, // SKU ID
          end_time: row.end_time || "", // End time, for checking if task is complete
        }))
      );
      setLoading(false);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to fetch manufacturing tasks");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCompleteClick = (taskId) => {
      updateTaskStatus(taskId);
  };

  const updateTaskStatus = async (taskId) => {
    try {
      setIsCompleteLoading((prev) => ({ ...prev, [taskId]: true })); // Set loading for this task
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/staff_dashboard/complete_task/${taskId}/`,
        { next_stage: nextStage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(response.data.message);
      fetchTasks(); // Refresh tasks after updating
    } catch (error) {
      console.error(error);
      setError("Error updating task status.");
    } finally {
      setIsCompleteLoading((prev) => ({ ...prev, [taskId]: false })); // Reset loading for this task
      setShowPopup(false); // Close popup after action
    }
  };

  const filteredRows = useMemo(() => {
    if (!filterValue.trim()) return rows;
    const searchTerm = filterValue.toLowerCase();
    return rows.filter((row) => {
      const matches = Object.values(row).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm)
      );
      return matches;
    });
  }, [rows, filterValue]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredRows.slice(start, end);
  }, [page, filteredRows]);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  return (
    <div style={{ marginTop: "-80px" }}>
        <NavBar />
        <SideBar /> {/* Add the SideBar component here */}
        <div className="flex-1 p-6 mt-8" style={{ padding: "40px" }}>

      <div className="flex-1">
        <div className="mt-4 p-8">
          <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold mb-6">Manufacturing Tasks</h1>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <Input
              size="md"
              placeholder="Search tasks"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              endContent={
                <SearchIcon className="text-default-400" width={16} />
              }
              className="w-72 mb-4"
            />

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div>Loading...</div>
              </div>
            ) : (
              <>
                <Table aria-label="Manufacturing tasks" className="min-w-full">
                  <TableHeader>
                    <TableColumn>Manu_id</TableColumn>
                    <TableColumn>qty</TableColumn>
                    <TableColumn>task</TableColumn>
                    <TableColumn>SKU_id</TableColumn>
                    <TableColumn>end time</TableColumn>
                    <TableColumn>Action</TableColumn>
                  </TableHeader>
                  <TableBody items={paginatedRows}>
                    {(item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.manufacturing_id}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>{item.status}</TableCell>
                        <TableCell>{item.sku_color}</TableCell>
                        <TableCell>
                          {item.end_time
                            ? dayjs
                                .utc(item.end_time)
                                .tz("America/Toronto")
                                .format("YYYY-MM-DD HH:mm")
                            : "Not completed yet"}
                        </TableCell>

                        <TableCell>
                          <Button
                            size="sm"
                            variant="shadow"
                            color="primary"
                            isLoading={isCompleteLoading[item.manufacturing_id]} // Check if loading for this task
                            isDisabled={item.end_time} // Disable button if end_time is not null
                            style={{
                              opacity: item.end_time ? 0.5 : 1, // Grey out if disabled
                              pointerEvents: item.end_time ? 'none' : 'auto', // Prevent clicks if disabled
                            }}
                            onPress={() => handleCompleteClick(item.manufacturing_id, item.status, item.end_time)}
                          >
                            complete
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
    </div>
  );
};

export default StaffManufacturingTasks;



