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
  Dropdown,
} from "@nextui-org/react";
import { SearchIcon } from "@nextui-org/shared-icons";
import axios from "axios";
import SideBar from "../dashboard_sidebar1/App";
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
  const [manuIdFilter, setManuIdFilter] = useState("");
  const [skuIdFilter, setSkuIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
          status: row.status?.trim(),
          sku_color: row.sku_color_id,
          due_date: row.due_date || "N/A",
          prod_qa: row.prod_qa,
          paint_qa: row.paint_qa,
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

  const handleUpdate = async (taskId, prodQaValue, paintQaValue, finalQaValue) => {
    try {
      await axios.post(
        "http://127.0.0.1:8000/qa_dashboard/qa_tasks/update/",
        {
          manufacturing_task_id: taskId,
          prod_qa: prodQaValue,
          paint_qa: paintQaValue,
          final_qa: finalQaValue,
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
        status: "In Progress",
      };
  
      console.log("Payload being sent to update status:", payload);
  
      const response = await axios.post(
        "http://127.0.0.1:8000/qa_dashboard/qa_tasks/update_status/",
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log("API response:", response.data);
      fetchTasks(); // Refresh the table data
      alert("Error status updated to 'In Progress'");
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

  const filteredRows = useMemo(() => {
    let result = rows;
    if (manuIdFilter.trim()) {
      result = result.filter((row) =>
        row.manufacturing_id
          .toString()
          .toLowerCase()
          .includes(manuIdFilter.toLowerCase())
      );
    }

    if (skuIdFilter.trim()) {
      result = result.filter((row) =>
        row.sku_color.toLowerCase().includes(skuIdFilter.toLowerCase())
      );
    }
    if (statusFilter) {
      result = result.filter((row) => row.status === statusFilter);
    }
  
    return result;
  }, [rows, manuIdFilter, skuIdFilter, statusFilter]);
  
  
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
          <div className="flex gap-4 mb-4">
  <Input
    size="md"
    placeholder="Search by Manu ID"
    value={manuIdFilter}
    onChange={(e) => setManuIdFilter(e.target.value)}
    endContent={<SearchIcon className="text-default-400" width={16} />}
    className="w-72"
  />
  <Input
    size="md"
    placeholder="Search by SKU ID"
    value={skuIdFilter}
    onChange={(e) => setSkuIdFilter(e.target.value)}
    endContent={<SearchIcon className="text-default-400" width={16} />}
    className="w-72"
  />
   <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="border rounded px-2 py-1 w-48"
  >
    <option value="" disabled hidden>
    Search by Status
    </option>
    <option value="In Progress">In Progress</option>
    <option value="Error">Error</option>
    <option value="Completed">Completed</option>
  </select>
</div>

          
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
                    <TableColumn>Actions</TableColumn>
                    <TableColumn>Status</TableColumn>
                    <TableColumn>Final QA</TableColumn>
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
      <TableCell>
        <Checkbox
          color="success"
          isSelected={item.prod_qa === "Completed"}
          onValueChange={(isSelected) => {
            const newProdQa = isSelected ? "Completed" : "Pending";
            handleUpdate(item.manufacturing_id, newProdQa, item.paint_qa, item.final_qa);
          }}
        />
      </TableCell>
      <TableCell>
        <Checkbox
          color="success"
          isSelected={item.paint_qa === "Completed"}
          onValueChange={(isSelected) => {
            const newPaintQa = isSelected ? "Completed" : "Pending";
            handleUpdate(item.manufacturing_id, item.prod_qa, newPaintQa, item.final_qa);
          }}
        />
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            color="danger"
            onClick={() => handleReportError(item.manufacturing_id)}
          >
            Report Error
          </Button>
          {item.status === "Error" && (
            <Button
              size="sm"
              variant="flat"
              color="success"
              onClick={() => {
                const isConfirmed = window.confirm(
                  "Are you sure the error has been fixed?"
                );
                if (isConfirmed) {
                  handleErrorFixed(item.manufacturing_id);
                }
              }}
            >
              Error Fixed
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell>{item.status}</TableCell>
      <TableCell>
        <Checkbox
          color="success"
          isSelected={item.prod_qa === "Completed" && item.paint_qa === "Completed"}
          isDisabled={item.status !== "Completed"}
          onValueChange={(isSelected) => {
            const newFinalQa = isSelected ? "Completed" : "Pending";
            handleUpdate(item.manufacturing_id, item.prod_qa, item.paint_qa, newFinalQa);
          }}
        />
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

