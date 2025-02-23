"use client";

import SideBar from "../../../dashboard_sidebar1/App"; 
import type {Selection, SortDescriptor} from "@nextui-org/react";
import type {ColumnsKey, ManufacturingTask} from "./data";
import type {Key} from "@react-types/shared";

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
  Chip,
} from "@nextui-org/react";
import {SearchIcon} from "@nextui-org/shared-icons";
import React, {useMemo, useRef, useCallback, useState, useEffect} from "react";
import {Icon} from "@iconify/react";
import {cn} from "@nextui-org/react";
import { saveAs } from 'file-saver';

import {CopyText} from "./copy-text";
import {EyeFilledIcon}from "./eye";
import {EditLinearIcon} from "./edit";
import {DeleteFilledIcon} from "./delete";
import {ArrowDownIcon} from "./arrow-down";
import {ArrowUpIcon} from "./arrow-up";

import {useMemoizedCallback} from "./use-memoized-callback";

import {columns, getVisibleColumns, fetchManufacturingTasks} from "./data";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import NavBar from "../../../navbar/App";
import "./styles.css";

export default function ManuTasksTable() {
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(new Set(getVisibleColumns()));
  const [rowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "manufacturing_task_id",
    direction: "ascending",
  });
  const [tasks, setTasks] = useState<ManufacturingTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await fetchManufacturingTasks();
        setTasks(data);
      } catch (error) {
        console.error("Failed to fetch manufacturing tasks", error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
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
    let filteredTasks = [...tasks];

    if (filterValue) {
      filteredTasks = filteredTasks.filter((item) =>
        item.sku_color.toLowerCase().includes(filterValue.toLowerCase()),
      );
    }

    return filteredTasks;
  }, [filterValue, tasks]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a: ManufacturingTask, b: ManufacturingTask) => {
      const col = sortDescriptor.column as keyof ManufacturingTask;

      const first = a[col];
      const second = b[col];

      const cmp = (first ?? '') < (second ?? '') ? -1 : (first ?? '') > (second ?? '') ? 1 : 0;

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
        const stringId = String(item.manufacturing_task_id);

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

  const renderCell = useMemoizedCallback((item: ManufacturingTask, columnKey: React.Key) => {
    const itemKey = columnKey as ColumnsKey;

    const cellValue = item[itemKey as keyof ManufacturingTask] as string;

    switch (itemKey) {
      case "manufacturing_task_id":
      case "sku_color":
        return <CopyText>{cellValue}</CopyText>;
      case "qty":
      case "due_date":
      case "status":
        return <div className="text-default-foreground">{cellValue}</div>;
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
        const resultKeys = new Set(filteredItems.map((item) => String(item.manufacturing_task_id)));

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
          ? new Set(filteredItems.map((item) => String(item.manufacturing_task_id)))
          : selectedKeys;

      selectedValue.forEach((v) => {
        if (filteredItems.some((item) => String(item.manufacturing_task_id) === v)) {
          return;
        }
        resultKeys.add(v);
      });
      setSelectedKeys(new Set(resultKeys));
    }
  });

  const exportData = () => {
    let selectedItems;

    if (filterSelectedKeys === "all") {
      selectedItems = tasks;
    } else {
      selectedItems = tasks.filter(item => filterSelectedKeys.has(String(item.manufacturing_task_id)));
    }
    
    const csvContent = [
      ["Task ID", "SKU Color", "Quantity", "Due Date", "Status", "Nesting Start Time", "Nesting End Time", "Nesting Employee", "Bending Start Time", "Bending End Time", "Bending Employee", "Cutting Start Time", "Cutting End Time", "Cutting Employee", "Welding Start Time", "Welding End Time", "Welding Employee", "Paint Start Time", "Paint End Time", "Paint Employee"],
      ...selectedItems.map(item => [
        item.manufacturing_task_id,
        item.sku_color,
        item.qty,
        item.due_date,
        item.status,
        item.nesting_start_time || "",
        item.nesting_end_time || "",
        item.nesting_employee || "",
        item.bending_start_time || "",
        item.bending_end_time || "",
        item.bending_employee || "",
        item.cutting_start_time || "",
        item.cutting_end_time || "",
        item.cutting_employee || "",
        item.welding_start_time || "",
        item.welding_end_time || "",
        item.welding_employee || "",
        item.paint_start_time || "",
        item.paint_end_time || "",
        item.paint_employee || ""
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'manufacturing_tasks.csv');
  };

  // const deleteSelectedItems = async () => {
  //   try {
  //     const itemIds = Array.from(filterSelectedKeys).map((key) => Number(key));
  //     await deleteInventoryItems(itemIds);
  //     const updatedInventory = await fetchInventoryData();
  //     setInventory(updatedInventory);
  //     setSelectedKeys(new Set());
  //   } catch (error) {
  //     console.error("Failed to delete selected items", error);
  //   }
  // };

  const handleSortChange = (column: ColumnsKey) => {
    setSortDescriptor((prevSortDescriptor) => ({
      column,
      direction: prevSortDescriptor.column === column && prevSortDescriptor.direction === "ascending"
        ? "descending"
        : "ascending",
    }));
  };

  // const confirmDelete = () => {
    
  //   if (window.confirm("Are you sure you want to delete the selected items?")) {
  //     handleDeleteConfirm();
  //   }
  // };

  // const handleDeleteConfirm = async () => {
  //   setIsDeletePopoverOpen(false);
  //   await deleteSelectedItems();
  //   toast.success("Items deleted successfully!");
  // };

  const topContent = useMemo(() => {
    return (
      <div className="flex items-center gap-4 overflow-auto px-[6px] py-[4px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            <Input
              className="min-w-[200px]"
              endContent={<SearchIcon className="text-default-400" width={16} />}
              placeholder="Search by SKU Color"
              size="sm"
              value={filterValue}
              onValueChange={onSearchChange}
            />
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
                {/* <DropdownItem key="delete-items" onPress={confirmDelete}>Delete Items</DropdownItem> */}
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
    // confirmDelete
  ]);

  const topBar = useMemo(() => {
    return (
      <div className="mb-[18px] flex items-center justify-between" style={{ marginTop: "40px" }}>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-[700] leading-[32px]">
            <b>Manufacturing Tasks</b>
          </h1>
          <Chip className="hidden items-center text-default-500 sm:flex" size="sm" variant="flat">
            {tasks.length}
          </Chip>
        </div>
      </div>
    );
  }, [tasks.length]);

  const bottomContent = useMemo(() => {
    return (
      
      <div className="flex flex-col justify-between gap-2 px-2 py-2 sm:flex-row">
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
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
    return <div className="loading-container">Loading... This may take a minute</div>;
  }

  return (
    <div style={{ backgroundColor: "#F8F8F8", marginTop: "-80px", minHeight: "100vh" }}>
      <NavBar />
      <SideBar /> {/* Add the SideBar component here */}
      <div className="flex-1 p-6" style={{ padding: "40px" }}>
        {topBar}
        <Table
          isHeaderSticky
          aria-label="Example table with custom cells, pagination and sorting"
          bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            td: "before:bg-transparent",
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
                  column.uid === "actions" ? "flex items-center justify-end px-[20px]" : "",
                ])}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody emptyContent={"No items found"} items={paginatedItems}>
            {(item) => (
              <TableRow key={item.manufacturing_task_id}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ToastContainer />
      </div>
    </div>
  );
}
