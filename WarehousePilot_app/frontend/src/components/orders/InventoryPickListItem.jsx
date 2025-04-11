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
  ModalBody,
  Tab,
} from "@heroui/react";
import { SearchIcon } from "@heroui/shared-icons";
import { useNavigate, useParams } from "react-router-dom";
import SideBar from "../dashboard_sidebar1/App";
import NavBar from "../navbar/App";
import axios from "axios";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;




const InventoryPicklistItem = () => {
  const { order_id } = useParams();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [manufacturingItems, setManufacturingItems] = useState([]);
  const [pickedQuantities, setPickedQuantities] = useState({});// changed 

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

  const [scannedSku, setScannedSku] = useState("");
  const [skuError, setSkuError] = useState(null); 

  const [manualPickModalOpen, setManualPickModalOpen] = useState(false); 

  const openManualPickModal = () => {
    setManualPickModalOpen(true);
  };

  const closeManualPickModal = () => {
    setManualPickQuantity(""); 
    setManualPickQuantityError(null); 
    setManualPickModalOpen(false);
    setPickModalOpen(false);
  };

  const handleManualPickConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found");
        return;
      }

      const pickedQuantity = parseInt(manualPickQuantity, 10);

      await axios.patch(
        `${API_BASE_URL}/inventory/inventory_picklist_items/${selectedItem.picklist_item_id}/pick/`,
        { manually_picked: true, picked_quantity: pickedQuantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

    
      setInventoryItems((prev) =>
        prev.map((item) =>
          item.picklist_item_id === selectedItem.picklist_item_id
            ? {
                ...item,
                actual_picked_quantity: item.actual_picked_quantity + pickedQuantity,
                status: true,
                manually_picked: true,
                picked_at: new Date().toISOString(), 
              }
            : item
        )
      );

      closeManualPickModal();
    } catch (err) {
      console.error("Error confirming manual pick:", err.response?.data || err.message);
      setError("Failed to confirm manual pick.");
    }
  };

  const [manualPickQuantity, setManualPickQuantity] = useState(""); 
  const [manualPickQuantityError, setManualPickQuantityError] = useState(null); 

  const handleManualPickQuantityConfirm = async () => {
    const requiredQuantity = selectedItem.quantity;

    if (parseInt(manualPickQuantity, 10) !== requiredQuantity) {
      setManualPickQuantityError(
        `The picked quantity must match the required quantity of ${requiredQuantity}.`
      );
      return;
    }

    setManualPickQuantityError(null); // Clear any previous errors
    handleManualPickConfirm(); // Proceed with the existing manual pick confirmation logic
  };

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
        item.sku_color?.toLowerCase().includes(searchTerm) ||
        item.area?.toLowerCase().includes(searchTerm) ||
        item.lineup_nb?.toLowerCase().includes(searchTerm) ||
        item.model_nb?.toLowerCase().includes(searchTerm) ||
        item.material_type?.toLowerCase().includes(searchTerm)
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
  const handlePickedQuantityChange = (picklistItemId, value) => {
    const newQuantity = parseInt(value, 10) || 0;
    setPickedQuantities((prev) => ({
      ...prev,
      [picklistItemId]: newQuantity,
    }));
  };
  
  // Pick Item Logic
  const openPickModal = (item) => {
    setSelectedItem(item);
    setPickModalOpen(true);
  };

  const closePickModal = () => {
    setSelectedItem(null);
    setScannedSku(""); 
    setPickQuantity("");
    setSkuError(null); 
    setPickQuantityError(null); 
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
  
      const pickedQuantity = parseInt(pickQuantity, 10);
      const requiredQuantity = selectedItem.quantity;
  
      if (pickedQuantity < requiredQuantity) {
        setPickQuantityError(
          `There are missing picks. Required: ${requiredQuantity}, Picked: ${pickedQuantity}.`
        );
        return;
      } else if (pickedQuantity > requiredQuantity) {
        setPickQuantityError(
          `⚠ Overpicked! Required: ${requiredQuantity}, Picked: ${pickedQuantity}.`
        );
        return;
      }
  
      setPickQuantityError(null);
  
      const response = await axios.patch(
        `${API_BASE_URL}/inventory/inventory_picklist_items/${selectedItem.picklist_item_id}/pick/`,
        { picked_quantity: pickedQuantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
    
      setInventoryItems((prev) =>
        prev.map((item) =>
          item.picklist_item_id === selectedItem.picklist_item_id
            ? {
                ...item,
                actual_picked_quantity: item.actual_picked_quantity + pickedQuantity,
                status: true,
                picked_at: new Date().toISOString(), 
              }
            : item
        )
      );
  
      closePickModal();
    } catch (err) {
      console.error("Error picking item:", err.response?.data || err.message);
      setError("Failed to confirm pick. Please try again.");
    }
  };

  const handleSkuScan = () => {
    if (scannedSku.trim() === selectedItem.sku_color) {
      setSkuError(null);
      handleConfirmPick();
    } else {
      setSkuError("Scanned SKU does not match the requested item. Please try again.");
    }
  };

  const [pickQuantity, setPickQuantity] = useState(""); 
  const [pickQuantityError, setPickQuantityError] = useState(null); 

  const handlePickQuantityAndSkuConfirm = () => {
    const requiredQuantity = selectedItem.quantity;
  
    if (parseInt(pickQuantity, 10) !== requiredQuantity) {
      setPickQuantityError(
        `The picked quantity must match the required quantity of ${requiredQuantity}.`
      );
      return;
    }
  
    if (scannedSku.trim() !== selectedItem.sku_color) {
      setSkuError("Scanned SKU does not match the requested item. Please try again.");
      return;
    }
  
    setPickQuantityError(null);
    setSkuError(null);
    handleConfirmPick(); 
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

  const handleLabelClick = (picklistItemId) => {
    navigate(`/label/${picklistItemId}`);
  };

  const [repickModalOpen, setRepickModalOpen] = useState(false); 
  const [repickReason, setRepickReason] = useState(""); 
  const [repickQuantity, setRepickQuantity] = useState(""); 

  const openRepickModal = (item) => {
    setSelectedItem(item);
    setRepickModalOpen(true);
  };

  const closeRepickModal = () => {
    setRepickReason("");
    setRepickQuantity("");
    setSelectedItem(null);
    setRepickModalOpen(false);
  };

  const handleRepickConfirm = async () => {
    if (!repickReason || !repickQuantity) {
      alert("Please select a reason and input a quantity.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found");
        return;
      }

      const response = await axios.patch(
        `${API_BASE_URL}/inventory/inventory_picklist_items/${selectedItem.picklist_item_id}/repick/`,
        { reason: repickReason, quantity: repickQuantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

  
      setInventoryItems((prev) =>
        prev.map((item) =>
          item.picklist_item_id === selectedItem.picklist_item_id
            ? {
                ...item,
                actual_picked_quantity:
                  item.actual_picked_quantity + parseInt(repickQuantity, 10),
                repick: true,
                repick_reason: repickReason,
              }
            : item
        )
      );

      closeRepickModal();
    } catch (err) {
      console.error("Error confirming repick:", err.response?.data || err.message);
      setError("Failed to confirm repick.");
    }
  };

  return (
    <div className="flex h-full">
      <SideBar isOpen={isSidebarOpen} />
       
           
        <div className="flex-1" style={{ width: "-webkit-fill-available" }}>
          <NavBar />

      <div className="flex-1" style={{ width: "auto" }}>
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
              style={{
                color: '#b91c1c',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
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
                    <Table  
                     aria-label="Inventory Pick List"
                     className="min-w-full shadow-lg"
                     isHeaderSticky
                     selectionMode="multiple"
                     bottomContentPlacement="outside"
                     classNames={{
                        td: "before:bg-transparent", 
                      }}
                      topContentPlacement="outside"
                    
                    
                    >
                      <TableHeader className="shadow-xl">
                        <TableColumn className="text-gray-800 font-bold text-base">Picklist Item ID</TableColumn>
                        <TableColumn className="text-gray-800 font-bold text-base">Location</TableColumn>
                        <TableColumn className="text-gray-800 font-bold text-base">Required Quantity</TableColumn>
                        <TableColumn className="text-gray-800 font-bold text-base">SKU Color</TableColumn>
                        <TableColumn className="text-gray-800 font-bold text-base">Lineup #</TableColumn>
                        <TableColumn className="text-gray-800 font-bold text-base">Model Type</TableColumn>
                        <TableColumn className="text-gray-800 font-bold text-base">Material Type</TableColumn>
                        <TableColumn className="text-gray-800 font-bold text-base">Area</TableColumn>
                        <TableColumn className="text-gray-800 font-bold text-base">Actual Picked Quantity</TableColumn>
                        <TableColumn className="text-gray-800 font-bold text-base">Status</TableColumn>
                        <TableColumn className="text-gray-800 font-bold text-base">Picked At</TableColumn>
                        <TableColumn className="text-gray-800 font-bold text-base">Action</TableColumn>
                        <TableColumn className="text-gray-800 font-bold text-base">Label</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {paginatedInventoryItems.map((item) => (
                          <TableRow key={item.picklist_item_id}>
                            <TableCell className="text-center">{item.picklist_item_id}</TableCell>
                            <TableCell className="text-center">
                              <span className="bg-blue-100 text-black-800 font-semibold px-2 py-1 rounded">
                                {item.location}
                              </span>
                            </TableCell>

                            <TableCell className="text-center">
                              <span className="bg-blue-100 text-black-800 font-semibold px-2 py-1 rounded">
                                {item.quantity}
                              </span>
                            </TableCell>

                            <TableCell className="text-center">
                              <span className="bg-blue-100 text-black-800 font-semibold px-2 py-1 rounded">
                                {item.sku_color}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">{item.lineup_nb || 'N/A'}</TableCell>
                            <TableCell className="text-center">{item.model_nb || 'N/A'}</TableCell>
                            <TableCell className="text-center">{item.material_type || 'N/A'}</TableCell>
                            <TableCell className="text-center">{item.area || 'N/A'}</TableCell>
                            <TableCell className="text-center">
                              <span className="bg-green-100 text-black-800 font-semibold px-2 py-1 rounded">
                                {item.actual_picked_quantity || 0} / {item.quantity}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.repick ? (
                                <span className="text-orange-500 font-semibold">Repicked</span>
                              ) : item.status ? (
                                <>
                                  Picked
                                  {item.manually_picked && (
                                    <span className="ml-2 text-red-500 font-semibold">(Manual)</span>
                                  )}
                                </>
                              ) : (
                                "To Pick"
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.picked_at ? new Date(item.picked_at).toLocaleString() : 'Not picked yet'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.status ? (
                                <span>Picked</span>
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={pickedQuantities[item.picklist_item_id] === item.quantity} // ✅ Checkbox turns blue when correct
                                  onChange={() => openPickModal(item)}
                                  style={{
                                    cursor: "pointer", 
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                                <Button 
                                  style={{
                                    backgroundColor: '#b91c1c',
                                    color: 'white',
                                  }}
                                  size="sm"
                                  onPress={() => handleLabelClick(item.picklist_item_id)}
                                >
                                  View Label
                                </Button>
                                {item.status && (
                                  <Button
                                    style={{
                                      backgroundColor: "#f59e0b",
                                      color: "white",
                                    }}
                                    size="sm"
                                    onPress={() => openRepickModal(item)}
                                  >
                                    Repick
                                  </Button>
                                )}
                              </div>
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
                        color="default"
                        classNames={{
                          item: "bg-white text-black",
                          cursor: "bg-black text-white",
                        }}
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
                          Please scan the SKU and input the quantity for the <b>{selectedItem.sku_color}</b> item to confirm.
                        </p>
                        {selectedItem.area && (
                          <p className="mt-2">
                            <b>Area:</b> {selectedItem.area}
                          </p>
                        )}
                        {selectedItem.lineup_nb && (
                          <p>
                            <b>Lineup:</b> {selectedItem.lineup_nb}
                          </p>
                        )}
                        {selectedItem.model_nb && (
                          <p>
                            <b>Model:</b> {selectedItem.model_nb}
                          </p>
                        )}
                        {selectedItem.material_type && (
                          <p>
                            <b>Material:</b> {selectedItem.material_type}
                          </p>
                        )}

                        <div className="mt-4">
                          <label className="block mb-2 font-semibold">Scan SKU:</label>
                          <Input
                            type="text"
                            placeholder="Scan SKU here"
                            value={scannedSku}
                            onChange={(e) => setScannedSku(e.target.value)}
                            size="md"
                          />
                          {skuError && (
                            <p className="text-red-600 mt-2">{skuError}</p>
                          )}
                        </div>

                        <div className="mt-4">
                          <label className="block mb-2 font-semibold">Quantity:</label>
                          <Input
                            type="number"
                            min="1"
                            value={pickQuantity}
                            onChange={(e) => setPickQuantity(e.target.value)}
                            size="md"
                          />
                          {pickQuantityError && (
                            <p className="text-red-600 mt-2">{pickQuantityError}</p>
                          )}
                        </div>

                        <div className="flex justify-end mt-6 gap-4">
                          <Button onPress={closePickModal} color="default">
                            Cancel
                          </Button>
                          <Button onPress={handlePickQuantityAndSkuConfirm} color="primary">
                            Confirm Pick
                          </Button>
                          <Button onPress={openManualPickModal} color="warning">
                            Manual Pick
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </ModalContent>
              </Modal>

              <Modal isOpen={manualPickModalOpen} onClose={closeManualPickModal}>
                <ModalContent>
                  <div className="p-4">
                    {selectedItem && (
                      <>
                        <h2 className="text-xl font-semibold mb-4">Manual Pick Confirmation</h2>
                        <p>
                          Please input the quantity for the <b>{selectedItem.sku_color}</b> item to confirm manual pick.
                        </p>
                        {selectedItem.area && (
                          <p className="mt-2">
                            <b>Area:</b> {selectedItem.area}
                          </p>
                        )}
                        {selectedItem.lineup_nb && (
                          <p>
                            <b>Lineup:</b> {selectedItem.lineup_nb}
                          </p>
                        )}
                        {selectedItem.model_nb && (
                          <p>
                            <b>Model:</b> {selectedItem.model_nb}
                          </p>
                        )}
                        {selectedItem.material_type && (
                          <p>
                            <b>Material:</b> {selectedItem.material_type}
                          </p>
                        )}

                        <div className="mt-4">
                          <label className="block mb-2 font-semibold">Quantity:</label>
                          <Input
                            type="number"
                            min="1"
                            value={manualPickQuantity}
                            onChange={(e) => setManualPickQuantity(e.target.value)}
                            size="md"
                          />
                          {manualPickQuantityError && (
                            <p className="text-red-600 mt-2">{manualPickQuantityError}</p>
                          )}
                        </div>

                        <div className="flex justify-end mt-6 gap-4">
                          <Button onPress={closeManualPickModal} color="default">
                            Cancel
                          </Button>
                          <Button onPress={handleManualPickQuantityConfirm} color="primary">
                            Confirm Manual Pick
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </ModalContent>
              </Modal>

              <Modal isOpen={repickModalOpen} onClose={closeRepickModal}>
                <ModalContent>
                  <div className="p-4">
                    {selectedItem && (
                      <>
                        <h2 className="text-xl font-semibold mb-4">Repick Item</h2>
                        <p>
                          Please select a reason and input the quantity for repicking the{" "}
                          <b>{selectedItem.sku_color}</b> item.
                        </p>
                        <div className="mt-4">
                          <label className="block mb-2 font-semibold">Reason:</label>
                          <select
                            value={repickReason}
                            onChange={(e) => setRepickReason(e.target.value)}
                            className="w-full p-2 border rounded"
                          >
                            <option value="">Select a reason</option>
                            <option value="missing">Missing</option>
                            <option value="damaged">Damaged</option>
                          </select>
                        </div>
                        <div className="mt-4">
                          <label className="block mb-2 font-semibold">Quantity:</label>
                          <Input
                            type="number"
                            min="1"
                            value={repickQuantity}
                            onChange={(e) => setRepickQuantity(e.target.value)}
                            size="md"
                          />
                        </div>
                        <div className="flex justify-end mt-6 gap-4">
                          <Button onPress={closeRepickModal} color="default">
                            Cancel
                          </Button>
                          <Button onPress={handleRepickConfirm} color="primary">
                            Confirm Repick
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
                        color="default"
                        classNames={{
                          item: "bg-white text-black",
                          cursor: "bg-black text-white",
                        }}
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
    </div>
  );
};

export default InventoryPicklistItem;