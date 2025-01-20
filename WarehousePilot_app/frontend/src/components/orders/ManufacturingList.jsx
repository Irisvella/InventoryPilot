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

import { useNavigate } from "react-router-dom";

const ManufacturingList = () => {
  const [filterValue, setFilterValue] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const rowsPerPage = 8;

  // Filter rows by search text
  const filteredRows = useMemo(() => {
    if (!filterValue.trim()) return rows;
    const searchTerm = filterValue.toLowerCase();
    return rows.filter((row) => {
      const orderIdMatch = row.order_id
        ?.toString()
        .toLowerCase()
        .includes(searchTerm);
      const statusMatch = row.status?.toLowerCase().includes(searchTerm);
      return orderIdMatch || statusMatch;
    });
  }, [rows, filterValue]);

  // Apply pagination
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredRows.slice(start, end);
  }, [page, filteredRows]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  const fetchManufacturingList = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        "http://127.0.0.1:8000/manufacturingLists/manufacturing_list/",
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
          manufacturing_list_id: row.manufacturing_list_id,
          order_id: row.order_id,
          status: row.status,
        }))
      );
      setLoading(false);
    } catch (err) {
      console.error("Error fetching manufacturing list:", err);
      setError("Failed to fetch manufacturing list");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManufacturingList();
  }, []);

  const handleViewOrderDetails = (order_id) => {
    navigate(`/manufacturing_list_item/${order_id}`);
  };

  return (
    <div className="mt-2 p-8">
      <h1 className="text-2xl font-bold mb-6">Manufacturing List</h1>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {/* Search Input */}
      <div className="mb-6 flex items-center gap-2">
        <Input
          size="md"
          placeholder="Search manufacturing lists"
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
          <Table aria-label="Manufacturing List" className="min-w-full">
            <TableHeader>
              <TableColumn>Manufacturing List ID</TableColumn>
              <TableColumn>Order ID</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Action</TableColumn>
            </TableHeader>

            <TableBody items={paginatedRows}>
              {(item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.manufacturing_list_id}</TableCell>
                  <TableCell>{item.order_id}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>
                    <Button
                      color="primary"
                      size="sm"
                      onPress={() => handleViewOrderDetails(item.order_id)}
                    >
                      View Details
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
  );
};

export default ManufacturingList;
