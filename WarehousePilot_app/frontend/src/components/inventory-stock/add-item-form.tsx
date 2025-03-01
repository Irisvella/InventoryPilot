import React, { useState, useEffect, useRef } from "react";
import { Input, Button } from "@heroui/react";
import type { Inventory, StatusOptions } from "./data";
import { toast } from "react-toastify";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import BarcodeScannerComponent from "react-qr-barcode-scanner";


type AddItemFormProps = {
  onAddItem: (newItem: Inventory) => void;
  onCancel: () => void;
};

export const AddItemForm: React.FC<AddItemFormProps> = ({ onAddItem, onCancel }) => {
  const [newItem, setNewItem] = useState<Omit<Inventory, "inventory_id">>({
    location: "",
    sku_color_id: "",
    qty: 0,
    warehouse_number: "",
    amount_needed: 0,
    status: "Low" as StatusOptions,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false); 
  const skuColorIdRef = useRef<HTMLInputElement>(null);

  const handleChange = (key: keyof Omit<Inventory, "inventory_id">, value: string | number) => {
    setNewItem((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...newItem, inventory_id: Date.now() }),
      });
      if (!response.ok) {
        throw new Error("Failed to add inventory item");
      }
      onAddItem({ ...newItem, inventory_id: Date.now() });
      toast.success("Item added successfully!");
      onCancel(); 
    } catch (error) {
      console.error("Failed to add inventory item", error);
      toast.error("Failed to add inventory item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleBarcodeScan = (event: Event) => {
      if (skuColorIdRef.current && event.target === skuColorIdRef.current) {
        console.log("Barcode scanned:", (event.target as HTMLInputElement).value); 
        handleChange("sku_color_id", (event.target as HTMLInputElement).value);
      }
    };

    window.addEventListener("input", handleBarcodeScan);
    return () => {
      window.removeEventListener("input", handleBarcodeScan);
    };
  }, []);

  return (
    <div className="p-4">
      <div className="mb-4">
        <Input
          label="Location"
          value={newItem.location}
          onChange={(e) => handleChange("location", e.target.value)}
          fullWidth
        />
      </div>
      <div className="mb-4">
        <Input
          label="SKU Color ID"
          value={newItem.sku_color_id}
          onChange={(e) => handleChange("sku_color_id", e.target.value)}
          fullWidth
          ref={skuColorIdRef}
        />
          <Button onPress={() => setIsScannerActive((prev) => !prev)}>
          {isScannerActive ? "Stop Scanner" : "Scan Barcode"}
        </Button>

      {isScannerActive && (
        <div className="mb-4 border rounded-lg p-2 bg-gray-200">
          <BarcodeScannerComponent
            width={300}
            height={300}
            onUpdate={(err, result) => {
              if (result) {
                handleChange("sku_color_id", result.getText());
                setIsScannerActive(false); 
              }
            }}
          />
        </div>
      )}

      </div>
      <div className="mb-4">
        <Input
          label="Quantity"
          type="number"
          value={newItem.qty.toString()}
          onChange={(e) => handleChange("qty", Number(e.target.value))}
          fullWidth
        />
      </div>
      <div className="mb-4">
        <Input
          label="Warehouse Number"
          value={newItem.warehouse_number}
          onChange={(e) => handleChange("warehouse_number", e.target.value)}
          fullWidth
        />
      </div>
      <div className="mb-4">
        <Input
          label="Amount Needed"
          type="number"
          value={newItem.amount_needed.toString()}
          onChange={(e) => handleChange("amount_needed", Number(e.target.value))}
          fullWidth
        />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button onPress={onCancel}>
          Cancel
        </Button>
        <Button onPress={handleSubmit} isDisabled={isSubmitting}>
          Add Item
        </Button>
      </div>
    </div>
  );
};
