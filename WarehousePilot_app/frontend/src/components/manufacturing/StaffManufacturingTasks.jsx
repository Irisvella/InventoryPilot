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
import Header from "../dashboard_sidebar/Header";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const StaffManufacturingTasks = () => {
  const [filterValue, setFilterValue] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
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
        "http://127.0.0.1:8000/staff_dashboard/staff_manufacturing_tasks/",
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
          end_time: row.end_time || "", // End time
          
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
    <div className="flex h-full">
      <SideBar />

      <div className="flex-1">
        <div className="mt-16 p-8">
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
                    <TableColumn>status</TableColumn>
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
                            : "added when we end task"}
                        </TableCell>
                       
                        <TableCell>
                          <Button size="sm" variant="shadow" color="primary">
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
  );
};

export default StaffManufacturingTasks;
