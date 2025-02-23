// CTPO: Cycle Time Per Order
// This page displays more in-depth information about cycle time per order


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
import SideBar from "../../dashboard_sidebar1/App";
import ProgressBar from "./progressbar";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CTPO = () => {

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

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/orders/ordersview/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Filter response data to only include items with a status
      const filteredData = response.data.filter(row => row.status !== null);

      setRows(
        filteredData.map((row, index) => ({
          id: index + 1,
          order_id: row.order_id,
          status: row.status,
          cycle_time: "N/A",
          pick_time: Math.floor(Math.random() * 10) + 1,
          pack_time: Math.floor(Math.random() * 10) + 1,
          ship_time: Math.floor(Math.random() * 10) + 1,
        }))
      );
      setLoading(false);
    } catch (err) {
      console.error("Error fetching orderes:", err);
      setError("Failed to fetch orders");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleViewOrderDetails = (order_id) => {
    navigate(`/manufacturing_list_item/${order_id}`);
  };

  const CTPO_COLUMNS = ["Order ID", "Status", "Cycle Time"];


  return (
    <div className="h-full w-full">
        <div className="w-screen flex-1">
        
            <SideBar />
            <main className="flex p-6 h-screen w-screen">
              <div className="mt-2 p-8 w-screen">
                <h1 className="text-2xl font-bold mb-6">Cycle Time Per Order Statistics</h1>

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
                    <Table aria-label="CTPO" className="min-w-full w-full">
                      <TableHeader>
                        {CTPO_COLUMNS.map((column) => (
                        <TableColumn key={column}>{column}</TableColumn>
                        ))}
                      </TableHeader>

                      <TableBody items={paginatedRows}>
                        {(item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.order_id}</TableCell>
                            <TableCell>{item.status ? item.status : "N/A"}</TableCell>
                            <TableCell><ProgressBar
                                        pickTime = {item.pick_time}
                                        packTime = {item.pack_time}
                                        shipTime = {item.ship_time}/>
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
                  </main>
              </div>


    </div>
  );
};

export default CTPO;

