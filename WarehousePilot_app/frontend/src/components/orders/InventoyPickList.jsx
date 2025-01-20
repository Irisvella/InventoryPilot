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
} from "@nextui-org/react";
import { SearchIcon } from "@nextui-org/shared-icons";
import axios from "axios";
import {Spinner} from "@heroui/spinner";
import { useNavigate } from "react-router-dom";

const InventoryPickList = () => {
  const [filterValue, setFilterValue] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const [userData, setUserData] = useState(null);
  const rowsPerPage = 8;
  const navigate = useNavigate();

  // For staff assignment modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [staffList, setStaffList] = useState([]); // all staff users
  const [staffSearchTerm, setStaffSearchTerm] = useState(""); // search text for staff
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [assigningOrderId, setAssigningOrderId] = useState(null);

  // Filter rows by search text
  const filteredRows = useMemo(() => {
    if (!filterValue.trim()) return rows;
    const searchTerm = filterValue.toLowerCase();
    return rows.filter((row) => {
      const orderIdMatch = row.order_id
        ?.toString()
        .toLowerCase()
        .includes(searchTerm);
      const dueDateMatch = row.due_date?.toLowerCase().includes(searchTerm);
      return orderIdMatch || dueDateMatch;
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

  const fetchPickList = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        "http://127.0.0.1:8000/orders/inventory_picklist/",
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
          order_id: row.order_id,
          due_date: row.due_date,
          already_filled: row.already_filled,
          assigned_to: row.assigned_to,
        }))
      );
      setLoading(false);
    } catch (err) {
      console.error("Error fetching inventory pick list:", err);
      setError("Failed to fetch inventory pick list");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickList();
  }, []);

  const handleViewOrderDetails = (order_id) => {
    navigate(`/inventory_picklist_items/${order_id}`);
  };

  // Staff assignment modal
  // Open the modal for a specific order
  const handleOpenAssignModal = async (orderId) => {
    setAssigningOrderId(orderId);
    setAssignModalOpen(true);
    setSelectedStaffId(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found");
        return;
      }
      const staffResp = await axios.get(
        "http://127.0.0.1:8000/auth/retrieve_users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // staffResp.data => array of staff like [{ id, first_name, last_name }, ...]
      setStaffList(staffResp.data);
      console.log("staffResp.data =>", staffResp.data);
    } catch (err) {
      console.error("Error fetching staff:", err);
      setError("Failed to fetch staff list");
    }
  };

  // Filter staff by staffSearchTerm
  // TODO: Integrate with dropdown?
  const filteredStaffList = useMemo(() => {
    if (!staffSearchTerm.trim()) return staffList;
    const lower = staffSearchTerm.toLowerCase();
    return staffList.filter((staff) => {
      const fullName = (staff.first_name + staff.last_name).toLowerCase();
      return fullName.includes(lower);
    });
  }, [staffList, staffSearchTerm]);

  // Confirm assignment
  const handleConfirmAssign = async () => {
    console.log("Inputed selected staff:" + selectedStaffId);
    if (!selectedStaffId) {
      alert("Please select a staff user");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found");
        return;
      }
      await axios.post(
        `http://127.0.0.1:8000/inventory/assign_order/${assigningOrderId}`,
        { user_id: selectedStaffId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      // Update local state
      const staffObj = staffList.find((st) => st.user_id === selectedStaffId);
      const staffName = staffObj
        ? `${staffObj.first_name} ${staffObj.last_name}`
        : "Unassigned";

      setRows((prev) =>
        prev.map((row) =>
          row.order_id === assigningOrderId
            ? { ...row, assigned_to: staffName }
            : row
        )
      );
      setAssignModalOpen(false);
    } catch (err) {
      console.error("Error assigning staff:", err);
      setError("Failed to assign staff");
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setAssignModalOpen(false);
    setStaffSearchTerm("");
    setSelectedStaffId(null);
    setAssigningOrderId(null);
  };

  return (
    <div className="mt-16 p-8">
      <h1 className="text-2xl font-bold mb-6">Inventory Pick List</h1>
      <h6 className="text-md font-bold">Few examples to test the different cases of orders being picked</h6>
      <p>order have both inventory picklist and manufacturinglist 90171, 89851 ,89672</p>
      <p>order have both inventory picklist and no  manufacturinglist 80555 </p>
      <p>order have none 89345 </p>

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
          Loading...
          <Spinner size="lg" />
          
        </div>
      ) : (
        <>
          <Table aria-label="Inventory Pick List" className="min-w-full">
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
                  <TableCell>{item.already_filled ? "Yes" : "No"}</TableCell>
                  <TableCell>{item.assigned_to || "Unassigned"}</TableCell>
                  <TableCell>
                    <Button
                      color="primary"
                      size="sm"
                      onPress={() => handleViewOrderDetails(item.order_id)}
                    >
                      Pick Order
                    </Button>
                    <Button
                      color="primary"
                      size="sm"
                      onPress={() => handleOpenAssignModal(item.order_id)}
                      className="ml-2"
                    >
                      Assign Staff
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
      {/* Staff Assignment Modal */}
      <Modal isOpen={assignModalOpen} onClose={handleCloseModal}>
        <ModalContent>
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Assign Staff</h2>

            {/* Search bar for staff */}
            <Input
              size="md"
              placeholder="Search staff"
              value={staffSearchTerm}
              onChange={(e) => setStaffSearchTerm(e.target.value)}
              className="mb-3"
            />

            {/* Staff dropdown */}
            <Select
              label="Assign Staff"
              placeholder="Select a staff member"
              value={selectedStaffId ? selectedStaffId.toString() : undefined}
              onChange={(newVal) => {
                console.log("Dropdown value:", newVal.target.value);
                setSelectedStaffId(Number(newVal.target.value));
                console.log("Selected staff:" + selectedStaffId);
              }}
              className="w-full"
            >
              {filteredStaffList
                .filter((staff) => staff.role === "staff")
                .map((staff) => {
                  const fullName = `${staff.first_name} ${staff.last_name}`;
                  return (
                    <SelectItem
                      key={staff.user_id} // toString() if needed ? ?
                      value={staff.user_id}
                    >
                      {fullName}
                    </SelectItem>
                  );
                })}
            </Select>
            <div className="flex justify-end mt-6 gap-4">
              <Button onPress={handleCloseModal} color="default">
                Cancel
              </Button>
              <Button onPress={handleConfirmAssign} color="primary">
                Confirm
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default InventoryPickList;
