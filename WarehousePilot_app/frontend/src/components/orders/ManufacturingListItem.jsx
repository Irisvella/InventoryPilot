import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Pagination,
} from "@nextui-org/react";
import { SearchIcon } from "@nextui-org/shared-icons";
import axios from "axios";
import SideBar from "../dashboard_sidebar1/App";
import { Button } from "@nextui-org/react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ManufacturingListItem = () => {
  const { order_id } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Add sidebar state
  const [filterValue, setFilterValue] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const navigate = useNavigate()

  const rowsPerPage = 8;

  const filteredRows = useMemo(() => {
    if (!filterValue.trim()) return rows;
    const searchTerm = filterValue.toLowerCase();
    return rows.filter((row) => {
      const skuMatch = row.sku_color?.toLowerCase().includes(searchTerm);
      const processMatch = row.manufacturing_process
        ?.toLowerCase()
        .includes(searchTerm);
      return skuMatch || processMatch;
    });
  }, [rows, filterValue]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredRows.slice(start, end);
  }, [page, filteredRows]);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  const fetchManufacturingListItems = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authorization token found");
        setLoading(false);
        return;
      }

      if (!order_id) {
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/manufacturingLists/manufacturing_list_item/${order_id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API Response:", response.data);

      if (!response.data || response.data.length === 0) {
        setError("No items found for this order");
        setLoading(false);
        return;
      }

      setRows(
        response.data.map((row, index) => ({
          id: index + 1,
          manufacturing_list_item_id: row.manufacturing_list_item_id,
          sku_color: row.sku_color,
          quantity: row.quantity,
          manufacturing_process: row.manufacturing_process,
          process_progress: row.process_progress,
        }))
      );
      setLoading(false);
    } catch (err) {
      console.error(
        "Error fetching manufacturing list items:",
        err.response?.data || err.message
      );
      setError(
        `Failed to fetch manufacturing list items: ${
          err.response?.data?.detail || err.message
        }`
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    if (order_id) {
      fetchManufacturingListItems();
    }
  }, [order_id]);

  // Add error boundary fallback
  if (error) {
    return (
      <div className="flex h-full">
        <SideBar isOpen={isSidebarOpen} />
        <div className="flex-1 sm:ml-8">
          <div className="mt-16 p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <SideBar isOpen={isSidebarOpen} />

      <div className="flex-1 sm:ml-8">
        <div className="mt-16 p-8">
          <h1 className="text-2xl font-bold mb-6">
            Manufacturing List Items for Order {order_id}
          </h1>

          {/* Search Input */}
          <div className="mb-6 flex items-center gap-2">
            <Input
              size="md"
              placeholder="Search items"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              endContent={
                <SearchIcon className="text-default-400" width={16} />
              }
              className="w-72"
            />
            <Button 
            color="primary"
            variant="light"
            onClick = { ()=> navigate("/inventory_and_manufacturing_picklist")}
            > Go back</Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div>Loading...</div>
            </div>
          ) : (
            <>
              <Table
                aria-label="Manufacturing List Items"
                className="min-w-full"
              >
                <TableHeader>
                  <TableColumn>Item ID</TableColumn>
                  <TableColumn>SKU Color</TableColumn>
                  <TableColumn>Quantity</TableColumn>
                  <TableColumn>Manufacturing Process</TableColumn>
                  <TableColumn>Process Progress</TableColumn>
                </TableHeader>

                <TableBody items={paginatedRows}>
                  {(item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.manufacturing_list_item_id}</TableCell>
                      <TableCell>{item.sku_color}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.manufacturing_process}</TableCell>
                      <TableCell>{item.process_progress}</TableCell>
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
  );
};

export default ManufacturingListItem;
