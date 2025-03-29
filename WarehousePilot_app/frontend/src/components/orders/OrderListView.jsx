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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { SearchIcon } from "@heroui/shared-icons";
import { FaPlay, FaCheck, FaClock } from "react-icons/fa6";
import { MdError } from "react-icons/md";
import axios from "axios";
import SideBar from "../dashboard_sidebar1/App";
import Header from "../dashboard_sidebar/Header";
import { useNavigate } from "react-router-dom";
import { FaExclamationCircle } from "react-icons/fa";
import CopyText from "../orders/copy-text";
import { Icon } from "@iconify/react";
import { Chip } from "@heroui/react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import NavBar from "../navbar/App";
import { Spinner } from "@heroui/spinner";
import { useTheme } from "../../context/ThemeContext";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Extend dayjs with UTC and timezone
dayjs.extend(utc);
dayjs.extend(timezone);

// Define columns for table (NEW)
const columns = [
  {
    uid: "order_id",
    name: "Order ID",
    sortable: true,
  },
  // {
  //   uid: "estimated_duration",
  //   name: "Estimated Duration",
  //   sortable: true,
  // },
  {
    uid: "status",
    name: "Status",
    sortable: true,
  },
  {
    uid: "due_date",
    name: "Due Date",
    sortable: true,
  },
  {
    uid: "start_timestamp",
    name: "Start Date",
    sortable: false,
  },
  {
    uid: "actions",
    name: "Action",
    sortable: false,
  },
];

// Function to get default visible columns (NEW)
const getVisibleColumns = () => {
  return columns.map(column => column.uid);
};

const OrderListView = () => {
  // State variables
  const { theme } = useTheme();
  const [filterValue, setFilterValue] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successOrderStart, setSuccessOrderStart] = useState(null);
  const [successListGeneration, setSuccessListGeneration] = useState(null);
  const [page, setPage] = useState(1);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  // Added sort descriptor state
  const [sortDescriptor, setSortDescriptor] = useState({ 
    column: "status", 
    direction: "ascending" 
  });
  // NEW: Column visibility state
  const [visibleColumns, setVisibleColumns] = useState(new Set(getVisibleColumns()));
  
  const navigate = useNavigate();
  const rowsPerPage = 10;
  
  // Filter rows based on search text
  const filteredRows = useMemo(() => {
    if (!filterValue.trim()) return rows;
    
    const searchTerm = filterValue.toLowerCase();
    
    console.log("Search Term:", searchTerm);
    console.log(
      "All Order IDs:",
      rows.map((row) => row.order_id)
    );
    
    return rows.filter((row) => {
      const orderIdMatch = row.order_id?.toString().includes(searchTerm);
      const durationMatch = row.estimated_duration
      ?.toString()
      .includes(searchTerm);
      const statusMatch = row.status?.toLowerCase().includes(searchTerm);
      const dueDateMatch = row.due_date?.toLowerCase().includes(searchTerm);
      
      return orderIdMatch || durationMatch || statusMatch || dueDateMatch;
    });
  }, [rows, filterValue]);
  
  // Updated sorting logic to prioritize "Not Started" orders by default
  const sortedFilteredRows = useMemo(() => {
    const rowsCopy = [...filteredRows];
    
    // First sort by status priority: "Not Started" first, then normal sort
    rowsCopy.sort((a, b) => {
      // Default priority: Not Started > other statuses
      if (a.status === "Not Started" && b.status !== "Not Started") {
        return -1;
      }
      if (a.status !== "Not Started" && b.status === "Not Started") {
        return 1;
      }
      
      // Then apply the user-selected sort
      const col = sortDescriptor.column;
      
      // For date comparison
      if (col === "due_date") {
        const dateA = a[col] ? new Date(a[col]) : new Date(0);
        const dateB = b[col] ? new Date(b[col]) : new Date(0);
        
        if (sortDescriptor.direction === "ascending") {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      }
      
      // For numeric comparison
      if (col === "order_id" || col === "estimated_duration") {
        const numA = Number(a[col]) || 0;
        const numB = Number(b[col]) || 0;
        
        if (sortDescriptor.direction === "ascending") {
          return numA - numB;
        } else {
          return numB - numA;
        }
      }
      
      // For string comparison (status)
      if (col === "status") {
        // If we're sorting by status and in ascending order,
        // "Not Started" should be at the top unless explicitly sorting in descending order
        if (sortDescriptor.direction === "ascending" && 
            (a.status === "Not Started" || b.status === "Not Started")) {
          if (a.status === "Not Started") return -1;
          if (b.status === "Not Started") return 1;
        }
        
        const strA = a[col]?.toLowerCase() || "";
        const strB = b[col]?.toLowerCase() || "";
        
        if (sortDescriptor.direction === "ascending") {
          return strA.localeCompare(strB);
        } else {
          return strB.localeCompare(strA);
        }
      }
      
      return 0;
    });
    
    return rowsCopy;
  }, [filteredRows, sortDescriptor]);
  
  // Apply pagination to the filtered rows
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    
    // If the filtered list has fewer pages, reset page number
    if (start >= sortedFilteredRows.length) {
      setPage(1); // Reset to first page if page number is out of range
    }
    
    return sortedFilteredRows.slice(start, end);
  }, [page, sortedFilteredRows]);
  
  // Calculate total pages based on the number of filtered rows
  const totalPages = Math.max(
    1,
    Math.ceil(sortedFilteredRows.length / rowsPerPage)
  );
  
  // NEW: filter columns based on visibility settings
  const visibleTableColumns = useMemo(() => {
    if (visibleColumns === "all") return columns;
    
    return columns.filter(
      (column) => Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);
  
  // Fetch orders data from the backend
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found");
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/orders/ordersview/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.data || response.data.length === 0) {
        console.error("No data received from API.");
        return;
      }
      
      console.log("Fetched Orders:", response.data);
      
      setRows(
        response.data.map((row, index) => ({
          id: index + 1,
          order_id: row.order_id?.toString() || "",
          estimated_duration: row.estimated_duration?.toString() || "",
          status: row.status || "Not Started",
          due_date: row.due_date || "",
          start_timestamp: row.start_timestamp || null,
        }))
      );
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to fetch orders");
      setLoading(false);
    }
  };
  
  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);
  
  // Auto-dismiss success message for starting the order after 5 seconds
  useEffect(() => {
    if (successOrderStart) {
      const timer = setTimeout(() => {
        setSuccessOrderStart(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successOrderStart]);
  
  // Auto-dismiss success message for generating lists after 5 seconds
  useEffect(() => {
    if (successListGeneration) {
      const timer = setTimeout(() => {
        setSuccessListGeneration(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successListGeneration]);
  
  // Handle the start button click event
  const handleStart = async (orderId) => {
    try {
      setUpdatingOrderId(orderId);
      setError(null);
      setSuccessOrderStart(null);
      
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("No authorization token found");
        return;
      }
      
      // Send POST request to start the order
      const response = await axios.post(
        `${API_BASE_URL}/orders/start_order/${orderId}/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      console.log("Response from backend (start_order):", response.data);
      
      if (response.data.status === "success") {
        // Update the order status and start timestamp
        setRows((prevRows) =>
          prevRows.map((row) =>
            row.order_id === orderId
              ? {
                  ...row,
                  status: response.data.order_status,
                  start_timestamp: response.data.start_timestamp,
                }
              : row
          )
        );
        setSuccessOrderStart(`Order ${orderId} successfully started!`);

        // Second POST request to generate the list (after starting the order)
        const generateListsResponse = await axios.post(
          `${API_BASE_URL}/orders/generateLists/`,
          { orderID: orderId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(
          "Response from backend (generateLists):",
          generateListsResponse.data
        );

        if (generateListsResponse.data.detail) {
          setSuccessListGeneration(generateListsResponse.data.detail);
        }
      } else {
        setError(`Error: ${response.data.message}`);
      }
    } catch (err) {
      console.error("Error starting the order:", err);
      if (err.response) {
        setError(
          `Error: ${err.response.data.message || "Unknown error occurred"}`
        );
      } else {
        setError("Error starting the order");
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // NEW: Render a table cell based on column key
  const renderCell = (item, columnKey) => {
    const cellValue = item[columnKey];
    
    switch (columnKey) {
      case "order_id":
        return (
          <div className="flex items-center">
            {item.order_id}
            <CopyText text={item.order_id.toString()} />
          </div>
        );
      case "estimated_duration":
        return <div>{item.estimated_duration}</div>;
      case "status":
        return (
          <div className="flex items-center gap-2">
            <Chip color="default" variant="flat">
              <span
                className={`flex items-center gap-1 px-2 py-1 rounded ${
                  item.status === "In Progress" ? "text-blue-800" : ""
                }`}
              >
                {item.status === "In Progress" ? (
                  <FaClock className="text-red" /> 
                ) : (
                  <FaExclamationCircle className="text-red-600 text-xl" />
                )}
                <span>{item.status || "Not started"}</span>
              </span>
            </Chip>
          </div>
        );
      case "due_date":
        return (
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:calendar-linear"
              width={18}
              className="text-gray-500"
            />
            <span>{item.due_date || "undefined"}</span>
          </div>
        );
      case "start_timestamp":
        return (
          <>
            {item.start_timestamp ? (
              <Chip color="success" variant="dot">
                {dayjs
                  .utc(item.start_timestamp)
                  .tz("America/Toronto")
                  .format("YYYY-MM-DD HH:mm")}
              </Chip>
            ) : (
              <Chip color="default" variant="flat">
                Not Started
              </Chip>
            )}
          </>
        );
      case "actions":
        return (
          <Button
            style={{
              backgroundColor: item.status === "In Progress" ? "#D1D5DB" : "#006FEE",
              color: item.status === "In Progress" ? "#000000" : "#FFFFFF",
            }}
            size="sm"
            isDisabled={
              item.status === "In Progress" || updatingOrderId !== null
            }
            onPress={() => handleStart(item.order_id)}
            startContent={
              item.status === "In Progress" ? <FaCheck /> : <FaPlay />
            }
          >
            {item.status === "In Progress" ? "Started" : "Start"}
          </Button>
        );
      default:
        return cellValue;
    }
  };

  return (
    <div>
      
      <SideBar />
     
      <div className="flex-1  bg-white dark:bg-gray-900 min-h-screen"> {/* Add min-h-screen and remove sm:ml-10 */}
        <NavBar />
        <div className="flex flex-col flex-1 p-8 mt-8 overflow-auto bg-white dark:bg-gray-900"> {/* Remove mt-8 */}
        <div className="flex flex-col flex-1">
          <div className="flex flex-col">
            <div className="flex flex-row justify-between items-center gap-11 mt-10">
              <h1 className="text-2xl font-bold mb-6 dark:text-white">Orders</h1>
              <Chip
  color="primary"
  radius="sm"
  size="lg"
  onClick={() => navigate("/inventory_and_manufacturing_picklist")}
  classNames={{
    base: "text-md border-small border-white/50 w-40 p-2 justify-item-center bg-gray-200", // Changed from dark:bg-gray-700 to bg-gray-200
    content: "drop-shadow text-gray-800", // Changed text color to gray-800
  }}
>
  Inventory and Manufacturing List
</Chip>
            </div>

            {/* Success message for starting the order */}
            {successOrderStart && (
             <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex justify-between items-center dark:bg-green-800 dark:border-green-600 dark:text-green-100">
                <span>{successOrderStart}</span>
                <button
                    onClick={() => setSuccessOrderStart(null)}
                    className="bg-transparent text-green-700 hover:text-green-900 font-semibold px-2 dark:text-green-100 dark:hover:text-green-300"
                  >
                  ×
                </button>
              </div>
            )}

            {/* Success message for generating the lists */}
            {successListGeneration && (
             <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex justify-between items-center dark:bg-green-800 dark:border-green-600 dark:text-green-100">
                <span>{successListGeneration}</span>
                <button
                    onClick={() => setSuccessListGeneration(null)}
                    className="bg-transparent text-green-700 hover:text-green-900 font-semibold px-2 dark:text-green-100 dark:hover:text-green-300"
                  >
                  ×
                </button>
              </div>
            )}

            {/* Error message */}
            {error && (
             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex justify-between items-center dark:bg-red-800 dark:border-red-600 dark:text-red-100">
                <span>{error}</span>
                <Button
                  onClick={() => setError(null)}
                  style={{
                    backgroundColor: '#b91c1c',
                    color: 'white',
                  }}
                >
                  ×
                </Button>
              </div>
            )}

            {/* Search, Sort and Column Visibility Controls */}
            <div className="mb-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full">
              <Input
                size="md"
                placeholder="Search by order ID, status, or due date"
                value={filterValue}
                onChange={(e) => {
                  console.log("New filter value:", e.target.value);
                  setFilterValue(e.target.value);
                }}
                endContent={<SearchIcon className="text-default-400" width={16} />}
                 className="w-full sm:w-72 dark:bg-transparent dark:text-white "
              />
              
              {/* Sort Dropdown */}
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="flat" 
                    startContent={<Icon icon="mdi:sort" width={16} />}
                    style={{ backgroundColor: '#f3f4f6', color: '#000' }}
                    className="dark:bg-gray-700 dark:text-white"
                  >
                    Sort by {sortDescriptor.column} ({sortDescriptor.direction})
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Sort options" className="dark:bg-gray-800">
                  <DropdownItem 
                    key="order_id" 
                    onPress={() => setSortDescriptor({ 
                      column: "order_id", 
                      direction: sortDescriptor.column === "order_id" && sortDescriptor.direction === "ascending" ? "descending" : "ascending" 
                    })}
                      className="dark:hover:bg-gray-700"
                  >
                    Order ID
                  </DropdownItem>
                  <DropdownItem 
                    key="due_date" 
                    onPress={() => setSortDescriptor({ 
                      column: "due_date", 
                      direction: sortDescriptor.column === "due_date" && sortDescriptor.direction === "ascending" ? "descending" : "ascending" 
                    })}
                       className="dark:hover:bg-gray-700"
                  >
                    Due Date
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
              
              {/* NEW: Column Visibility Dropdown */}
              <Dropdown closeOnSelect={false}>
                <DropdownTrigger>
                  <Button 
                    variant="flat" 
                    startContent={<Icon icon="material-symbols:view-column" width={16} />}
                     style={{ backgroundColor: '#f3f4f6', color: '#000' }}
                      className="dark:bg-gray-700 dark:text-white"
                  >
                    Columns
                  </Button>
                </DropdownTrigger>
                <DropdownMenu 
                  disallowEmptySelection
                  aria-label="Column Visibility"
                  selectedKeys={visibleColumns}
                  selectionMode="multiple"
                  onSelectionChange={setVisibleColumns}
                  className="dark:bg-gray-800"
                >
                  {columns.map((column) => (
                    <DropdownItem key={column.uid}    className="dark:hover:bg-gray-700">{column.name}</DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-64 dark:text-white">
                <div>Loading...
                <Spinner size="lg" color="default" className="ms-5"/>
                </div>
              </div>
            ) : (
              <>
                <Table
                  aria-label="Inventory Pick List"
                  className="min-w-full shadow-lg dark:bg-transparent"
                  isHeaderSticky
                  selectionMode="multiple"
                  bottomContentPlacement="outside"
                  classNames={{
                    wrapper: "dark:bg-gray-800",
                    th: "dark:bg-gray-700 dark:text-white",
                    tr: "dark:hover:bg-gray-700",
                    td: "dark:text-white dark:before:bg-transparent"
                  }}
                  topContentPlacement="outside"
                >
                  <TableHeader className="shadow-xl">
                    {visibleTableColumns.map((column) => (
                      <TableColumn 
                        key={column.uid} 
                        className="text-gray-800 font-bold text-lg dark:text-white"
                      >
                        {column.name}
                      </TableColumn>
                    ))}
                  </TableHeader>

                  <TableBody items={paginatedRows}>
                    {(item) => (
                      <TableRow key={item.id}>
                        {visibleTableColumns.map((column) => (
                          <TableCell key={`${item.id}-${column.uid}`}>
                            {renderCell(item, column.uid)}
                          </TableCell>
                        ))}
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <div className="flex justify-between items-center mt-4 dark:text-white">
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <Pagination
                    total={totalPages}
                    initialPage={1}
                    current={page}
                    onChange={(newPage) => setPage(newPage)}
                    classNames={{
                      item: "bg-white text-black dark:bg-gray-700 dark:text-white",
                      cursor: "bg-black text-white dark:bg-blue-600 dark:text-white",
                    }}
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

export default OrderListView;
