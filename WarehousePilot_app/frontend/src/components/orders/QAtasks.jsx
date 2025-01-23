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
} from "@nextui-org/react";
import { SearchIcon } from "@nextui-org/shared-icons";
import axios from "axios";
import SideBar from "../dashboard_sidebar1/App";
import Header from "../dashboard_sidebar/Header";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const QATasks = () => {
  const [filterValue, setFilterValue] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Fetch QA tasks
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found");
        setLoading(false);
        return;
      }
      const response = await axios.get(
        "http://127.0.0.1:8000/qa_dashboard/qa_tasks/",
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
          manufacturing_id: row.manufacturing_task_id,
          qty: row.qty,
          status: row.status,
          sku_color: row.sku_color_id,
          due_date: row.due_date || "N/A",
          // The back end returns "Completed" or "Pending" as strings
          prod_qa: row.prod_qa,
          paint_qa: row.paint_qa,
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


  const handleUpdate = async (taskId, prodQaValue, paintQaValue) => {
    try {
      await axios.post(
        "http://127.0.0.1:8000/qa_dashboard/qa_tasks/update/",
        {
          manufacturing_task_id: taskId,
          prod_qa: prodQaValue,     // "Completed" or "Pending"
          paint_qa: paintQaValue,   // "Completed" or "Pending"
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      fetchTasks(); // Refresh data after update
    } catch (error) {
      console.error("Error updating QA task:", error);
      alert("Failed to update QA task.");
    }
  };

  // Report an error with subject & comment
  const handleReportError = async (taskId) => {
    
    const subject = prompt("Enter the subject of the error:", "Defect Found");
    if (subject == null) return; // user cancelled
    const comment = prompt("Enter additional details:", "Describe the issue...");
    if (comment == null) return; // user cancelled

    try {
      await axios.post(
        "http://127.0.0.1:8000/qa_dashboard/qa_tasks/report_error/",
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

  // Filter rows
  const filteredRows = useMemo(() => {
    if (!filterValue.trim()) return rows;
    const searchTerm = filterValue.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm)
      )
    );
  }, [rows, filterValue]);

  // Paginate rows
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredRows.slice(start, end);
  }, [page, filteredRows]);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  return (
    <div className="flex h-full">
      <SideBar />
      <div className="flex-1">
        <div className="mt-16 p-8">
          <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold mb-6">QA Tasks</h1>
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
              endContent={<SearchIcon className="text-default-400" width={16} />}
              className="w-72 mb-4"
            />
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div>Loading...</div>
              </div>
            ) : (
              <>
                <Table aria-label="QA tasks" className="min-w-full">
                  <TableHeader>
                    <TableColumn>Manu ID</TableColumn>
                    <TableColumn>Qty</TableColumn>
                    <TableColumn>SKU ID</TableColumn>
                    <TableColumn>Due Date</TableColumn>
                    <TableColumn>Production QA</TableColumn>
                    <TableColumn>Paint QA</TableColumn>
                    <TableColumn>Status</TableColumn>
                    <TableColumn>Actions</TableColumn>
                  </TableHeader>
                  <TableBody items={paginatedRows}>
                    {(item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.manufacturing_id}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>{item.sku_color}</TableCell>
                        <TableCell>
                          {item.due_date !== "N/A"
                            ? dayjs(item.due_date).format("YYYY-MM-DD")
                            : "N/A"}
                        </TableCell>
                        {/* Production QA checkbox */}
                        <TableCell>
                          <Checkbox
                            color="success"
                            isSelected={item.prod_qa === "Completed"}
                            onValueChange={(isSelected) => {
                              // Convert boolean to "Completed"/"Pending"
                              const newProdQa = isSelected ? "Completed" : "Pending";
                              handleUpdate(item.manufacturing_id, newProdQa, item.paint_qa);
                            }}
                          >
                        
                          </Checkbox>
                        </TableCell>
                        {/* Paint QA checkbox */}
                        <TableCell>
                          <Checkbox
                            color="success"
                            isSelected={item.paint_qa === "Completed"}
                            onValueChange={(isSelected) => {
                              const newPaintQa = isSelected ? "Completed" : "Pending";
                              handleUpdate(item.manufacturing_id, item.prod_qa, newPaintQa);
                            }}
                          >
                            
                          </Checkbox>
                        </TableCell>
                        <TableCell>{item.status}</TableCell>
                        <TableCell>
                          {/* Report an error */}
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            onClick={() => handleReportError(item.manufacturing_id)}
                          >
                            Report Error
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <Pagination
                    total={totalPages}
                    page={page}
                    initialPage={1}
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

export default QATasks;

