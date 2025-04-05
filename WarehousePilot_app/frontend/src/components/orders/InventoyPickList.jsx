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
  ModalContent,
  Select,
  SelectItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip
} from "@heroui/react";
import { SearchIcon } from "@heroui/shared-icons";
import axios from "axios";
import { Spinner } from "@heroui/spinner";
import { useNavigate } from "react-router-dom";
import CopyText from "../orders/copy-text";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
// import SideBar from "../dashboard_sidebar1/App";
import NavBar from "../navbar/App";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const columns = [
  { uid: "order_id", name: "Order ID", sortable: true },
  { uid: "due_date", name: "Due Date", sortable: true },
  { uid: "already_filled", name: "Already Filled", sortable: false },
  { uid: "assigned_to", name: "Assigned To", sortable: false },
  { uid: "actions", name: "Action", sortable: false }
];

const getVisibleColumns = () => columns.map(col => col.uid);

const InventoryPickList = () => {
  const [filterValue, setFilterValue] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState({ column: "order_id", direction: "ascending" });
  const [visibleColumns, setVisibleColumns] = useState(new Set(getVisibleColumns()));

  const rowsPerPage = 10;
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [assigningOrderId, setAssigningOrderId] = useState(null);

  useEffect(() => { fetchPickList(); }, []);

  const fetchPickList = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return setError("No authorization token found");

      const response = await axios.get(`${API_BASE_URL}/orders/inventory_picklist/`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      });

      setRows(response.data.map((row, i) => ({
        id: i + 1,
        order_id: row.order_id,
        due_date: row.due_date,
        already_filled: row.already_filled,
        assigned_to: row.assigned_to
      })));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch inventory pick list");
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    if (!filterValue.trim()) return rows;
    const searchTerm = filterValue.toLowerCase();
    return rows.filter(row => {
      const orderIdMatch = row.order_id?.toString().toLowerCase().includes(searchTerm);
      const dueDateMatch = row.due_date?.toLowerCase().includes(searchTerm);
      const assignedToMatch = row.assigned_to?.toLowerCase().includes(searchTerm);
      const alreadyFilledMatch = searchTerm === "yes" ? row.already_filled : searchTerm === "no" ? !row.already_filled : false;
      return orderIdMatch || dueDateMatch || assignedToMatch || alreadyFilledMatch;
    });
  }, [rows, filterValue]);

  const sortedFilteredRows = useMemo(() => {
    const rowsCopy = [...filteredRows];
    const col = sortDescriptor.column;

    if (col === "due_date") {
      const withDueDate = rowsCopy.filter(r => r.due_date);
      const withoutDueDate = rowsCopy.filter(r => !r.due_date);

      withDueDate.sort((a, b) => {
        const dateA = new Date(a.due_date);
        const dateB = new Date(b.due_date);
        return sortDescriptor.direction === "ascending" ? dateA - dateB : dateB - dateA;
      });
      return [...withDueDate, ...withoutDueDate];
    }

    rowsCopy.sort((a, b) => {
      if (col === "order_id") return sortDescriptor.direction === "ascending" ? a[col] - b[col] : b[col] - a[col];
      if (col === "already_filled") return sortDescriptor.direction === "ascending" ? a[col] - b[col] : b[col] - a[col];
      if (col === "assigned_to") return sortDescriptor.direction === "ascending" ? a[col].localeCompare(b[col]) : b[col].localeCompare(a[col]);
      return 0;
    });
    return rowsCopy;
  }, [filteredRows, sortDescriptor]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    if (start >= sortedFilteredRows.length) {
      setPage(1);
      return sortedFilteredRows.slice(0, rowsPerPage);
    }
    return sortedFilteredRows.slice(start, end);
  }, [page, sortedFilteredRows]);

  const totalPages = Math.max(1, Math.ceil(sortedFilteredRows.length / rowsPerPage));

  const visibleTableColumns = useMemo(() => {
    if (visibleColumns === "all") return columns;
    return columns.filter(col => Array.from(visibleColumns).includes(col.uid));
  }, [visibleColumns]);

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
      case "due_date":
        return (
          <div className="flex items-center gap-2">
            <Icon icon="solar:calendar-linear" width={18} className="text-gray-500 dark:text-gray-400" />
            {item.due_date ? (
              <span>{item.due_date}</span>
            ) : (
              <Chip className="italic" color="default" size="sm" variant="flat">Not set</Chip>
            )}
          </div>
        );
      case "already_filled":
        return item.already_filled ? "Yes" : "No";
      case "assigned_to":
        return item.assigned_to ? (
          <Chip className="capitalize" color="success" size="sm" variant="flat">{item.assigned_to}</Chip>
        ) : (
          <Chip className="capitalize" color="default" size="sm" variant="flat">Unassigned</Chip>
        );
      case "actions":
        return (
          <>
            <Button style={{ backgroundColor: '#b91c1c', color: 'white' }} size="sm" onPress={() => navigate(`/inventory_picklist_items/${item.order_id}`)}>Pick Order</Button>
            <Button style={{ backgroundColor: '#b91c1c', color: 'white' }} size="sm" onPress={() => handleOpenAssignModal(item.order_id)} className="ml-2">Assign Staff</Button>
            <Button style={{ backgroundColor: '#b91c1c', color: 'white' }} size="sm" onPress={() => navigate(`/label/all/${item.order_id}`)} className="ml-2">View Labels</Button>
          </>
        );
      default:
        return cellValue;
    }
  };

  const handleOpenAssignModal = async (orderId) => {
    setAssigningOrderId(orderId);
    setAssignModalOpen(true);
    setSelectedStaffId(null);
    try {
      const token = localStorage.getItem("token");
      const staffResp = await axios.get(`${API_BASE_URL}/auth/retrieve_users`, { headers: { Authorization: `Bearer ${token}` } });
      setStaffList(staffResp.data);
    } catch (err) {
      console.error("Error fetching staff:", err);
      setError("Failed to fetch staff list");
    }
  };

  const handleConfirmAssign = async () => {
    if (!selectedStaffId) return alert("Please select a staff user");
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/inventory/assign_order/${assigningOrderId}`, { user_id: selectedStaffId }, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      });
      const staffObj = staffList.find((st) => st.user_id === selectedStaffId);
      const staffName = staffObj ? `${staffObj.first_name} ${staffObj.last_name}` : "Unassigned";
      setRows(prev => prev.map(row => row.order_id === assigningOrderId ? { ...row, assigned_to: staffName } : row));
      setAssignModalOpen(false);
    } catch (err) {
      console.error("Error assigning staff:", err);
      setError("Failed to assign staff");
    }
  };

  const handleCloseModal = () => {
    setAssignModalOpen(false);
    setStaffSearchTerm("");
    setSelectedStaffId(null);
    setAssigningOrderId(null);
  };

  const filteredStaffList = useMemo(() => {
    if (!staffSearchTerm.trim()) return staffList;
    const lower = staffSearchTerm.toLowerCase();
    return staffList.filter((staff) => (staff.first_name + staff.last_name).toLowerCase().includes(lower));
  }, [staffList, staffSearchTerm]);

  return (
    <div className="flex-1 bg-white dark:bg-gray-900 min-h-screen">
      <NavBar />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 dark:text-white">Inventory Pick List</h1>
        
        <div className="mb-6">
          <h6 className="text-md font-bold dark:text-white">
            Few examples to test the different cases of orders being picked
          </h6>
          <p className="dark:text-white">
            Order have both inventory picklist and manufacturing list: 90171, 89851, 89672
          </p>
          <p className="dark:text-white">
            Order have inventory picklist and no manufacturing list: 80555
          </p>
          <p className="dark:text-white">Order have none: 89345</p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
          <Input
            size="md"
            placeholder="Search by order ID, due date, or assignment"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            endContent={<SearchIcon className="text-default-400" width={16} />}
            className="w-full sm:w-72"
          />
          <Dropdown>
            <DropdownTrigger>
              <Button 
                    variant="flat" 
                    startContent={<Icon icon="mdi:sort" width={16} />}
                    style={{ backgroundColor: '#f3f4f6', color: '#000' }}
                  >Sort: {sortDescriptor.column} ({sortDescriptor.direction})</Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Sort options">
              {columns.filter(c => c.sortable).map(col => (
                <DropdownItem
                  key={col.uid}
                  onPress={() => setSortDescriptor({
                    column: col.uid,
                    direction: sortDescriptor.column === col.uid && sortDescriptor.direction === "ascending" ? "descending" : "ascending"
                  })}
                >
                  {col.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <Dropdown closeOnSelect={false}>
            <DropdownTrigger>
              <Button variant="flat">Columns</Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Column Visibility"
              selectedKeys={visibleColumns}
              selectionMode="multiple"
              onSelectionChange={setVisibleColumns}
            >
              {columns.map(col => (
                <DropdownItem key={col.uid}>{col.name}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            Loading... <Spinner size="lg" className="ml-4" />
          </div>
        ) : (
          <>
            <Table aria-label="Inventory Pick List">
              <TableHeader>
                {visibleTableColumns.map(col => (
                  <TableColumn key={col.uid} allowsSorting={col.sortable}>{col.name}</TableColumn>
                ))}
              </TableHeader>
              <TableBody items={paginatedRows}>
                {(item) => (
                  <TableRow key={item.id}>
                    {visibleTableColumns.map(col => (
                      <TableCell key={`${item.id}-${col.uid}`}>{renderCell(item, col.uid)}</TableCell>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4">
              <span>Page {page} of {totalPages}</span>
              <Pagination total={totalPages} current={page} onChange={(p) => setPage(p)} />
            </div>
          </>
        )}

        <Modal isOpen={assignModalOpen} onClose={handleCloseModal}>
          <ModalContent>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">Assign Staff</h2>
              <Input
                placeholder="Search staff"
                value={staffSearchTerm}
                onChange={(e) => setStaffSearchTerm(e.target.value)}
                className="mb-3"
              />
              <Select
                placeholder="Select a staff member"
                value={selectedStaffId ? selectedStaffId.toString() : undefined}
                onChange={(e) => setSelectedStaffId(Number(e.target.value))}
              >
                {filteredStaffList.filter(s => s.role === "staff").map(staff => (
                  <SelectItem key={staff.user_id} value={staff.user_id}>
                    {staff.first_name} {staff.last_name}
                  </SelectItem>
                ))}
              </Select>
              <div className="flex justify-end mt-6 gap-4">
                <Button onPress={handleCloseModal}>Cancel</Button>
                <Button onPress={handleConfirmAssign} style={{ backgroundColor: "#b91c1c", color: "white" }}>Confirm</Button>
              </div>
            </div>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default InventoryPickList;