// route: /assigned_picklist
// Description: A page to display the assigned pick lists for the staff user. 

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
import { useNavigate } from "react-router-dom";
import NavBar from "../navbar/App";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AssignedPickList = () => {
  const [filterValue, setFilterValue] = useState("");
  const [rows, setRows] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const navigate = useNavigate();

  // Filter orders by search text
  const filteredRows = useMemo(() => {
    if (!filterValue.trim()) return rows;
    const searchTerm = filterValue.toLowerCase();
    return rows.filter((row) => {
      const orderIdMatch = row.order_id?.toString().toLowerCase().includes(searchTerm);
      const dueDateMatch = row.due_date?.toLowerCase().includes(searchTerm);
      return orderIdMatch || dueDateMatch;
    });
  }, [rows, filterValue]);

  // Pagination
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredRows.slice(start, end);
  }, [page, filteredRows]);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  // Fetch only the assigned pick lists for current user
  const fetchAssignedPickList = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found");
        setLoading(false);
        return;
      }
      const response = await axios.get(
        `${API_BASE_URL}/inventory/assigned_inventory_picklist/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setRows(
        response.data.map((row, idx) => ({
          id: idx + 1,
          order_id: row.order_id,
          due_date: row.due_date,
          already_filled: row.already_filled,
          assigned_to: row.assigned_to,
        }))
      );
      setLoading(false);
    } catch (err) {
      console.error("Error fetching assigned pick list:", err);
      setError("Failed to fetch assigned pick list");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedPickList();
  }, []);

  const handleViewOrderDetails = (order_id) => {
    navigate(`/inventory_picklist_items/${order_id}`);
  };

  return (
    <div style={{ marginTop: "-50px" }}>
        <NavBar />
        <SideBar /> {/* Add the SideBar component here */}
        <div className="flex-1 p-6" style={{ padding: "20px" }}>
      <div className="flex-1">
        <div className="mt-16 p-8">
          <h1 className="text-2xl font-bold mb-6">My Assigned Pick List</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

          <div className="mb-6 flex items-center gap-2">
            <Input
              size="md"
              placeholder="Search orders"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              endContent={<SearchIcon className="text-default-400" width={16} />}
              className="w-72"
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div>Loading...</div>
            </div>
          ) : (
            <>
              <Table aria-label="Assigned Pick List" className="min-w-full">
                <TableHeader>
                  <TableColumn>Order ID</TableColumn>
                  <TableColumn>Due Date</TableColumn>
                  <TableColumn>Already Filled</TableColumn>
                  <TableColumn>Assigned To</TableColumn>
                  <TableColumn>Action</TableColumn>
                </TableHeader>

                <TableBody items={paginatedRows}>
                  {(item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.order_id}</TableCell>
                      <TableCell>{item.due_date}</TableCell>
                      <TableCell>
                        {item.already_filled ? "Yes" : "No"}
                      </TableCell>
                      <TableCell>{item.assigned_to || "Unassigned"}</TableCell>
                      <TableCell>
                        <Button
                          color="primary"
                          size="sm"
                          onPress={() => handleViewOrderDetails(item.order_id)}
                        >
                          Pick Order
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

export default AssignedPickList;
