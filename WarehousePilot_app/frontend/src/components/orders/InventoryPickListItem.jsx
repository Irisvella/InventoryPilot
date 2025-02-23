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
  Tab,
} from "@nextui-org/react";
import { SearchIcon } from "@nextui-org/shared-icons";
import { useNavigate, useParams } from "react-router-dom";
import SideBar from "../dashboard_sidebar1/App";
import axios from "axios";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const InventoryPicklistItem = () => {
  const { order_id } = useParams();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [manufacturingItems, setManufacturingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterValue, setFilterValue] = useState("");
  const [page, setPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);

  const [items, setItems] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  const navigate = useNavigate();
  const rowsPerPage = 8;

  const user = localStorage.getItem("user");
  const parsedUser = user ? JSON.parse(user) : null;
  const userRole = parsedUser ? parsedUser.role : null;
  // pick item modal
  const [pickModalOpen, setPickModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [inventoryError, setInventoryError] = useState(null);
  const [manufacturingError, setManufacturingError] = useState(null);

  // Fetch both inventory and manufacturing items for the given order
  const fetchOrderItems = async (order_id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token found");

      const [inventoryResponse, manufacturingResponse] = await Promise.all([
        axios
          .get(
            `${API_BASE_URL}/orders/inventory_picklist_items/${order_id}/`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
          .catch((error) => {
            setInventoryError("No inventory items found for this order");
            return { data: [] };
          }),
        axios
          .get(
            `${API_BASE_URL}/manufacturingLists/manufacturing_list_item/${order_id}/`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
          .catch((error) => {
            setManufacturingError(
              "No manufacturing items found for this order"
            );
            return { data: [] };
          }),
      ]);

      setInventoryItems(inventoryResponse.data);
      setManufacturingItems(manufacturingResponse.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching order items:", err);
      setError("Failed to fetch order items");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderItems(order_id);
  }, [order_id]);

  // Filter rows by search text
  // Filter rows for inventory items based on search text
  const filteredInventoryItems = useMemo(() => {
    if (!filterValue.trim()) return inventoryItems;
    const searchTerm = filterValue.toLowerCase();
    return inventoryItems.filter(
      (item) =>
        item.picklist_item_id?.toString().toLowerCase().includes(searchTerm) ||
        item.location?.toLowerCase().includes(searchTerm) ||
        item.sku_color?.toLowerCase().includes(searchTerm)
    );
  }, [inventoryItems, filterValue]);

  // Filter rows for manufacturing items based on search text
  const filteredManufacturingItems = useMemo(() => {
    if (!filterValue.trim()) return manufacturingItems;
    const searchTerm = filterValue.toLowerCase();
    return manufacturingItems.filter(
      (item) =>
        item.manufacturing_list_item_id
          ?.toString()
          .toLowerCase()
          .includes(searchTerm) ||
        item.sku_color?.toLowerCase().includes(searchTerm) ||
        item.manufacturing_process?.toLowerCase().includes(searchTerm)
    );
  }, [manufacturingItems, filterValue]);

  

  const totalInventoryPages = Math.ceil(
    filteredInventoryItems.length / rowsPerPage
  );
  const totalManufacturingPages = Math.ceil(
    filteredManufacturingItems.length / rowsPerPage
  );

  // Pick Item Logic
  const openPickModal = (item) => {
    setSelectedItem(item);
    setPickModalOpen(true);
  };

  const closePickModal = () => {
    setSelectedItem(null);
    setPickModalOpen(false);
  };

  const handleConfirmPick = async () => {
    if (!selectedItem) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found");
        return;
      }
      await axios.patch(
        `${API_BASE_URL}/inventory/inventory_picklist_items/${selectedItem.picklist_item_id}/pick/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setInventoryItems((prev) =>
        prev.map((it) =>
          it.picklist_item_id === selectedItem.picklist_item_id
            ? { ...it, status: true }
            : it
        )
      );
      closePickModal();
    } catch (err) {
      console.error("Error picking item:", err.response?.data || err.message);
      setError("Not allowed, you need to login as a staff");
    }
  };

  // Apply pagination for inventory items
  const paginatedInventoryItems = useMemo(() => {
    const start = (inventoryPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredInventoryItems.slice(start, end);
  }, [inventoryPage, filteredInventoryItems]);

  // Apply pagination for manufacturing items
  const paginatedManufacturingItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredManufacturingItems.slice(start, end);
  }, [page, filteredManufacturingItems]);

  // ... (keep all the imports and component code the same until the return statement)

  const handleLabelClick = (picklistItemId) => {
    navigate(`/label/${picklistItemId}`);
  };

  return (
    <div className="flex h-full">
      <SideBar isOpen={isSidebarOpen} />

      <div className="flex-1 sm:ml-8">
        <div className="mt-16 p-8">
          <h1 className="text-2xl font-bold mb-6">Order {order_id} Details</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

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
              color="default"
              variant="faded"
              onPress={() => {
                if (userRole === "admin" || userRole === "manager") {
                  navigate("/inventory_and_manufacturing_picklist");
                } else if (userRole === "staff") {
                  navigate("/inventory_and_manufacturing_picklist");// Will be changed to /assigned_picklist once the table is completed
                }
              }}
            >
              Go back
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div>Loading...</div>
            </div>
          ) : (
            <div>
              {/* Inventory Items Section */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">
                  Inventory Pick List Items
                </h2>
                {inventoryError ? (
                  <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded">
                    {inventoryError}
                  </div>
                ) : paginatedInventoryItems.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableColumn>Picklist Item ID</TableColumn>
                        <TableColumn>Location</TableColumn>
                        <TableColumn>SKU Color</TableColumn>
                        <TableColumn>Quantity</TableColumn>
                        <TableColumn>Status</TableColumn>
                        <TableColumn>Action</TableColumn>
                        <TableColumn>Label</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {paginatedInventoryItems.map((item) => (
                          <TableRow key={item.picklist_item_id}>
                            <TableCell>{item.picklist_item_id}</TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell>{item.sku_color}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              {item.status ? "Picked" : "To Pick"}
                            </TableCell>
                            <TableCell>
                              {item.status ? (
                                <span>Picked</span>
                              ) : (
                                <input
                                  type="checkbox"
                                  onChange={() => openPickModal(item)}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                               color="primary"
                               size="sm"
                                onPress={() => handleLabelClick(item.picklist_item_id)}>
                                View Label
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex justify-between items-center mt-4">
                      <span>
                        Page {inventoryPage} of {totalInventoryPages}
                      </span>
                      <Pagination
                        total={totalInventoryPages}
                        initialPage={1}
                        current={inventoryPage}
                        onChange={(newPage) => setInventoryPage(newPage)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded">
                    No inventory items found for this order.
                  </div>
                )}
              </div>

              <Modal isOpen={pickModalOpen} onClose={closePickModal}>
                <ModalContent>
                  <div className="p-4">
                    {selectedItem && (
                      <>
                        <h2 className="text-xl font-semibold mb-4">
                          Pick Item Confirmation
                        </h2>
                        <p>
                          Do you want to pick this{" "}
                          <b>{selectedItem.sku_color}</b> item?
                        </p>

                        <div className="flex justify-end mt-6 gap-4">
                          <Button onPress={closePickModal} color="default">
                            Cancel
                          </Button>
                          <Button onPress={handleConfirmPick} color="primary">
                            Yes, Pick
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </ModalContent>
              </Modal>

              {/* Manufacturing Items Section */}
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4">
                  Manufacturing List Items
                </h2>
                {manufacturingError ? (
                  <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded">
                    {manufacturingError}
                  </div>
                ) : paginatedManufacturingItems.length > 0 ? (
                  <>
                    <Table
                      aria-label="Rows actions table example with dynamic content"
                      removeWrapper
                      className="bg-gray-200 rounded-lg border-collapse"
                      css={{
                        height: "auto",
                        minWidth: "100%",
                      }}
                      selectionMode="single"
                    >
                      <TableHeader>
                        <TableColumn>Item ID</TableColumn>
                        <TableColumn>SKU Color</TableColumn>
                        <TableColumn>Quantity</TableColumn>
                        <TableColumn>Manufacturing Process</TableColumn>
                        <TableColumn>Process Progress</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {paginatedManufacturingItems.map((item) => (
                          <TableRow key={item.manufacturing_list_item_id}>
                            <TableCell>
                              {item.manufacturing_list_item_id}
                            </TableCell>
                            <TableCell>{item.sku_color}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.manufacturing_process}</TableCell>
                            <TableCell>{item.process_progress}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex justify-between items-center mt-4">
                      <span>
                        Page {page} of {totalManufacturingPages}
                      </span>
                      <Pagination
                        total={totalManufacturingPages}
                        initialPage={1}
                        current={page}
                        onChange={(newPage) => setPage(newPage)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded">
                    No manufacturing items found for this order.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryPicklistItem;
