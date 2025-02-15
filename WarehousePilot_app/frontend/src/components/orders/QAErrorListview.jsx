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
} from "@nextui-org/react";
import { SearchIcon } from "@nextui-org/shared-icons";
import axios from "axios";
import SideBar from "../dashboard_sidebar1/App";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const QAErrorListView = () => {
  const [filterValue, setFilterValue] = useState("");
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchQAErrors = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setErrorMsg("No authorization token found");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/qa_dashboard/qa_tasks/error_reports/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        // If server returns an array, set errors. Otherwise it's likely an error object.
        if (Array.isArray(response.data)) {
          setErrors(response.data);
        } else {
          setErrorMsg(response.data.error || "Failed to fetch QA errors");
        }

      } catch (err) {
        console.error("Error fetching QA errors:", err);
        setErrorMsg("Failed to fetch QA errors");
      } finally {
        setLoading(false);
      }
    };

    fetchQAErrors();
  }, []);

  const handleResolveError = async (errorId) => {
    if (!window.confirm("Are you sure you want to mark this error as resolved?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No authorization token found");
        return;
      }

      await axios.post(
        `${API_BASE_URL}/qa_dashboard/qa_tasks/error_reports/resolve/`,
        { error_id: errorId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove the resolved error from the table
      setErrors((prev) => prev.filter((err) => err.id !== errorId));
      alert("Error resolved and removed.");
    } catch (err) {
      console.error("Error resolving QA error:", err);
      if (err.response?.status === 403) {
        // For example, if the backend says only managers can do this
        alert("You are not authorized to resolve errors.");
      } else {
        alert("Failed to resolve the error. Check console for details.");
      }
    }
  };

  // Filtering logic
  const filteredErrors = useMemo(() => {
    if (!filterValue.trim()) return errors;
    const searchTerm = filterValue.toLowerCase();
    return errors.filter((err) =>
      [err.subject, err.comment, err.manufacturing_task_id?.toString()].some((value) =>
        value?.toLowerCase().includes(searchTerm)
      )
    );
  }, [errors, filterValue]);

  // Pagination
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedErrors = filteredErrors.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredErrors.length / rowsPerPage);

  return (
    <div className="flex h-full">
      <SideBar />

      <div className="flex-1">
        <div className="mt-16 p-8">
          <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold mb-6">QA Error Reports</h1>

            {errorMsg && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {errorMsg}
              </div>
            )}

            <Input
              size="md"
              placeholder="Search QA errors..."
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
                <Table aria-label="QA Error list" className="min-w-full">
                  <TableHeader>
                    <TableColumn>ID</TableColumn>
                    <TableColumn>Subject</TableColumn>
                    <TableColumn>Comment</TableColumn>
                    <TableColumn>Task ID</TableColumn>
                    <TableColumn>Task Status</TableColumn>
                    <TableColumn>Reported By</TableColumn>
                    <TableColumn>Created At</TableColumn>
                    {/* Everyone can see the "Resolve" button,
                        but only managers pass the backend check */}
                    <TableColumn>Actions</TableColumn>
                  </TableHeader>
                  <TableBody items={paginatedErrors}>
                    {(item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.subject}</TableCell>
                        <TableCell>{item.comment}</TableCell>
                        <TableCell>{item.manufacturing_task_id}</TableCell>
                        <TableCell>{item.task_status}</TableCell>
                        <TableCell>{item.reported_by}</TableCell>
                        <TableCell>
                          {dayjs.utc(item.created_at)
                            .tz("America/Toronto")
                            .format("YYYY-MM-DD HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            onClick={() => handleResolveError(item.id)}
                          >
                            Resolve
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

export default QAErrorListView;





