import React, { useState } from "react";
import { Input, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import type { Inventory, StatusOptions } from "./data";
import { toast } from "react-toastify";

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

  const handleChange = (key: keyof Omit<Inventory, "inventory_id">, value: string | number) => {
    setNewItem((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/inventory/add", {
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
        />
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
