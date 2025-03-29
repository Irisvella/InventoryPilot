"use client";

import SideBar from "../dashboard_sidebar1/App"; 
import type {Selection, SortDescriptor} from "@heroui/react";
import type {ColumnsKey, Inventory, StatusOptions} from "./data";
import type {Key} from "@react-types/shared";
import { Spinner } from "@heroui/spinner";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Pagination,
  Divider,
  Tooltip,
  useButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Chip,
  Badge,
} from "@heroui/react";
import {SearchIcon} from "@heroui/shared-icons";
import React, {useMemo, useRef, useCallback, useState, useEffect} from "react";
import {Icon} from "@iconify/react";
import {cn} from "@heroui/react";
import { saveAs } from 'file-saver';

import {CopyText} from "./copy-text";
import {EyeFilledIcon}from "./eye";
import {EditLinearIcon} from "./edit";
import {DeleteFilledIcon} from "./delete";
import {ArrowDownIcon} from "./arrow-down";
import {ArrowUpIcon} from "./arrow-up";

import {useMemoizedCallback} from "./use-memoized-callback";

import {columns, INITIAL_VISIBLE_COLUMNS, fetchInventoryData, statusColorMap, deleteInventoryItems} from "./data";
import NotifCard from "../notifications/notifications-card/App";
import { AddItemForm } from "./add-item-form";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import NavBar from "../navbar/App";

export default function InventoryTable() {
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "inventory_id",
    direction: "ascending",
  });
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(() => {
    const savedStatus = localStorage.getItem("unreadNotifications");
    return savedStatus ? JSON.parse(savedStatus) : true;
  }); 
  const [isAddItemPopoverOpen, setIsAddItemPopoverOpen] = useState(false);
  const [isDeletePopoverOpen, setIsDeletePopoverOpen] = useState(false);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const data = await fetchInventoryData();
        setInventory(data);
      } catch (error) {
        console.error("Failed to fetch inventory data", error);
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  const headerColumns = useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns
      .map((item) => {
        if (item.uid === sortDescriptor.column) {
          return {
            ...item,
            sortDirection: sortDescriptor.direction,
          };
        }

        return item;
      })
      .filter((column) => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns, sortDescriptor]);

  const filteredItems = useMemo(() => {
    let filteredInventory = [...inventory];

    if (filterValue) {
      filteredInventory = filteredInventory.filter((item) =>
        item.sku_color_id.toLowerCase().includes(filterValue.toLowerCase()),
      );
    }

    return filteredInventory;
  }, [filterValue, inventory]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a: Inventory, b: Inventory) => {
      const col = sortDescriptor.column as keyof Inventory;

      const first = a[col];
      const second = b[col];

      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, filteredItems]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return sortedItems.slice(start, end);
  }, [page, sortedItems, rowsPerPage]);

  const filterSelectedKeys = useMemo(() => {
    if (selectedKeys === "all") return selectedKeys;
    let resultKeys = new Set<Key>();

    if (filterValue) {
      filteredItems.forEach((item) => {
        const stringId = String(item.inventory_id);

        if ((selectedKeys as Set<string>).has(stringId)) {
          resultKeys.add(stringId);
        }
      });
    } else {
      resultKeys = selectedKeys;
    }

    return resultKeys;
  }, [selectedKeys, filteredItems, filterValue]);

  const eyesRef = useRef<HTMLButtonElement | null>(null);
  const editRef = useRef<HTMLButtonElement | null>(null);
  const deleteRef = useRef<HTMLButtonElement | null>(null);
  const {getButtonProps: getEyesProps} = useButton({ref: eyesRef});
  const {getButtonProps: getEditProps} = useButton({ref: editRef});
  const {getButtonProps: getDeleteProps} = useButton({ref: deleteRef});

  const renderCell = useMemoizedCallback((item: Inventory, columnKey: React.Key) => {
    const itemKey = columnKey as ColumnsKey;

    const cellValue = item[itemKey as keyof Inventory] as string;

    switch (itemKey) {
      case "inventory_id":
      case "sku_color_id":
        return <CopyText>{cellValue}</CopyText>;
      case "location":
      case "qty":
      case "warehouse_number":
      case "amount_needed":
        return <div className="text-default-foreground">{cellValue}</div>;
      case "status":
        return <div className="flex items-center gap-2">{statusColorMap[cellValue as StatusOptions]} {cellValue}</div>;
        case "edit":
        return (
          <div className="flex items-center gap-2">
            <Button {...(getEditProps() as any)} ref={editRef} isIconOnly variant="flat">
              <EditLinearIcon />
            </Button>
          </div>
        );
      default:
        return cellValue;
    }
  });

  const onNextPage = useMemoizedCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  });

  const onPreviousPage = useMemoizedCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  });

  const onSearchChange = useMemoizedCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  });

  const onSelectionChange = useMemoizedCallback((keys: Selection) => {
    if (keys === "all") {
      if (filterValue) {
        const resultKeys = new Set(filteredItems.map((item) => String(item.inventory_id)));

        setSelectedKeys(resultKeys);
      } else {
        setSelectedKeys(keys);
      }
    } else if (keys.size === 0) {
      setSelectedKeys(new Set());
    } else {
      const resultKeys = new Set<Key>();

      keys.forEach((v) => {
        resultKeys.add(v);
      });
      const selectedValue =
        selectedKeys === "all"
          ? new Set(filteredItems.map((item) => String(item.inventory_id)))
          : selectedKeys;

      selectedValue.forEach((v) => {
        if (filteredItems.some((item) => String(item.inventory_id) === v)) {
          return;
        }
        resultKeys.add(v);
      });
      setSelectedKeys(new Set(resultKeys));
    }
  });

  const handleNotificationsRead = () => {
    setUnreadNotifications(false);
    localStorage.setItem("unreadNotifications", JSON.stringify(false)); // Save to local storage
  };

  const exportData = () => {
    let selectedItems;

    if (filterSelectedKeys === "all") {
      selectedItems = inventory;
    } else {
      selectedItems = inventory.filter(item => filterSelectedKeys.has(String(item.inventory_id)));
    }
    
    const csvContent = [
      ["Inventory ID", "SKU Color ID", "Location", "Quantity", "Warehouse Number", "Amount Needed", "Status"],
      ...selectedItems.map(item => [
        item.inventory_id,
        item.sku_color_id,
        item.location,
        item.qty,
        item.warehouse_number,
        item.amount_needed,
        item.status
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'inventory_data.csv');
  };

  const deleteSelectedItems = async () => {
    try {
      const itemIds = Array.from(filterSelectedKeys).map((key) => Number(key));
      await deleteInventoryItems(itemIds);
      const updatedInventory = await fetchInventoryData();
      setInventory(updatedInventory);
      setSelectedKeys(new Set());
    } catch (error) {
      console.error("Failed to delete selected items", error);
    }
  };

  const handleSortChange = (column: ColumnsKey) => {
    setSortDescriptor((prevSortDescriptor) => ({
      column,
      direction: prevSortDescriptor.column === column && prevSortDescriptor.direction === "ascending"
        ? "descending"
        : "ascending",
    }));
  };

  const confirmDelete = () => {
    
    if (window.confirm("Are you sure you want to delete the selected items?")) {
      handleDeleteConfirm();
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeletePopoverOpen(false);
    await deleteSelectedItems();
    toast.success("Items deleted successfully!");
  };

  const topContent = useMemo(() => {
    return (
      <div className="flex items-center gap-4 overflow-auto px-[6px] py-[4px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            <Input
              className="min-w-[200px]"
              endContent={<SearchIcon className="text-default-400" width={16} />}
              placeholder="Search by SKU Color ID"
              size="sm"
              value={filterValue}
              onValueChange={onSearchChange}
            />
            <Tooltip content="Sort in Ascending or Descending order">
            <div>
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    className="bg-default-100 text-default-800"
                    size="sm"
                    startContent={
                      <Icon className="text-default-400" icon="solar:sort-linear" width={16} />
                    }
                  >
                    Sort
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Sort"
                  items={headerColumns.filter((c) => !["actions", "status"].includes(c.uid))}
                >
                  {(item) => (
                    <DropdownItem
                      key={item.uid}
                      onPress={() => handleSortChange(item.uid as ColumnsKey)}
                    >
                      {item.name}
                    </DropdownItem>
                  )}
                </DropdownMenu>
              </Dropdown>
            </div>
            </Tooltip>
            <Tooltip content="Add or remove columns">
            <div>
              <Dropdown closeOnSelect={false}>
                <DropdownTrigger>
                  <Button
                    className="bg-default-100 text-default-800"
                    size="sm"
                    startContent={
                      <Icon
                        className="text-default-400"
                        icon="solar:sort-horizontal-linear"
                        width={16}
                      />
                    }
                  >
                    Columns
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="Columns"
                  items={columns.filter((c) => !["actions"].includes(c.uid))}
                  selectedKeys={visibleColumns}
                  selectionMode="multiple"
                  onSelectionChange={setVisibleColumns}
                >
                  {(item) => <DropdownItem key={item.uid}>{item.name}</DropdownItem>}
                </DropdownMenu>
              </Dropdown>
            </div>
            </Tooltip>
          </div>

          <Divider className="h-5" orientation="vertical" />

          <div className="whitespace-nowrap text-sm text-default-800">
            {filterSelectedKeys === "all"
              ? "All items selected"
              : `${filterSelectedKeys.size} Selected`}
          </div>

          {(filterSelectedKeys === "all" || filterSelectedKeys.size > 0) && (
            <Dropdown>
              <DropdownTrigger>
                <Button
                  className="bg-default-100 text-default-800"
                  endContent={
                    <Icon className="text-default-400" icon="solar:alt-arrow-down-linear" />
                  }
                  size="sm"
                  variant="flat"
                >
                  Selected Actions
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Selected Actions">
                <DropdownItem key="export-data" onPress={exportData}>Export Data</DropdownItem>
                <DropdownItem key="delete-items" onPress={confirmDelete}>Delete Items</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
      </div>
    );
  }, [
    filterValue,
    visibleColumns,
    filterSelectedKeys,
    headerColumns,
    sortDescriptor,
    onSearchChange,
    setVisibleColumns,
    exportData,
    confirmDelete
  ]);

  const topBar = useMemo(() => {
    return (
      <div className="mb-[18px] flex items-center justify-between" style={{ marginTop: "40px" }}>
        <div className="flex w-[226px] items-center gap-2">
          <h1 className="text-2xl font-[700] leading-[32px]">
            <b className="dark:text-white">Inventory</b>
          </h1>
          <Tooltip content="Total number of items in inventory">
          <Chip className="hidden items-center text-default-500 sm:flex" size="sm" variant="flat">
            {inventory.length}
          </Chip>
          </Tooltip>
        </div>
        <div className="flex items-center gap-6">
          <Popover>
            <PopoverTrigger>
              <Button isIconOnly variant="flat">
              <Badge
                style={{ backgroundColor: "#b91c1c" }} // Custom red color
                content=" "
                shape="circle"
                isInvisible={!unreadNotifications}
              >
  <Icon icon="solar:bell-outline" width={24} />
</Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <NotifCard onMarkAllAsRead={handleNotificationsRead} />
            </PopoverContent>
          </Popover>
          <Popover isOpen={isAddItemPopoverOpen} onOpenChange={setIsAddItemPopoverOpen}>
            <PopoverTrigger>
              <Button className= "bg-gray-600" endContent={<Icon icon="solar:add-circle-bold" width={20} />}>
                Add Item
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <AddItemForm onAddItem={(newItem) => {
                setInventory((prevInventory) => [...prevInventory, newItem]);
                setIsAddItemPopoverOpen(false);
              }} onCancel={() => setIsAddItemPopoverOpen(false)} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  }, [inventory.length, unreadNotifications, isAddItemPopoverOpen]);

  const bottomContent = useMemo(() => {
    return (
      <div className="flex flex-col justify-between gap-2 px-2 py-2 sm:flex-row">
        <Pagination
                            total={pages}
                          initialPage={1}
                         
                          onChange={setPage}
                          classNames={{
                            item: "bg-white text-black dark:bg-gray-700 dark:text-white",
                            cursor: "bg-black text-white dark:bg-blue-600 dark:text-white",
                          }}
                        />
      
        <div className="flex items-center justify-end gap-6 ml-auto">
          <span className="text-small text-default-400">
            {filterSelectedKeys === "all"
              ? "All items selected"
              : `${filterSelectedKeys.size} of ${filteredItems.length} selected`}
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <Button isDisabled={page === 1} size="sm" variant="flat" onPress={onPreviousPage}>
              Previous
            </Button>
            <Button isDisabled={page === pages} size="sm" variant="flat" onPress={onNextPage}>
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  }, [filterSelectedKeys, page, pages, filteredItems.length, onPreviousPage, onNextPage]);

  if (loading) {
    return <div className="loading-container">Loading... This may take a minute
    <Spinner size="lg" color="default" className="ms-5"/>
    </div>;
  }
  

  return (
   <div className="flex-1 px-10 dark:bg-gray-900" style={{ minHeight: "100vh" }}>
       
        <SideBar /> {/* Add the SideBar component here */}
        <div className="flex-1 mt-2 ">
        <NavBar />
        {topBar}
        <Table
          isHeaderSticky
          aria-label="Example table with custom cells, pagination and sorting"
          bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            wrapper: "dark:bg-gray-800",
            th: "dark:bg-gray-700 dark:text-white",
            tr: "dark:hover:bg-gray-700",
            td: "dark:text-white dark:before:bg-transparent"
          }}
          selectedKeys={filterSelectedKeys}
          selectionMode="multiple"
          sortDescriptor={sortDescriptor}
          topContent={topContent}
          topContentPlacement="outside"
          onSelectionChange={onSelectionChange}
          onSortChange={setSortDescriptor}
        >
          <TableHeader columns={headerColumns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "actions" ? "end" : "start"}
                className={cn([
                  column.uid === "actions" ? "flex items-center justify-end px-[20px]" : "", "dark:text-white"
                ])}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody emptyContent={"No items found"} items={paginatedItems}>
            {(item) => (
              <TableRow key={item.inventory_id}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ToastContainer 
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </div>
  );
}
