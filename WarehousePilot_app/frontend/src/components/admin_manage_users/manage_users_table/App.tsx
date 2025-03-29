"use client";

import type {Selection, SortDescriptor} from "@heroui/react";
import type {ColumnsKey, StatusOptions, Users} from "./data";
import type {Key} from "@react-types/shared";
import SideBar from "../../dashboard_sidebar1/App";
import NavBar from "../../navbar/App";

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
  RadioGroup,
  Radio,
  Chip,
  User,
  Pagination,
  Divider,
  Tooltip,
  useButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import {SearchIcon} from "@heroui/shared-icons";
import React, {useMemo, useRef, useCallback, useState, useEffect} from "react";
import {Icon} from "@iconify/react";
import {cn} from "@heroui/react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { confirmDelete } from './data';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {CopyText} from "./copy-text";
import {EditLinearIcon} from "./edit";
import {DeleteFilledIcon} from "./delete";
import {ArrowDownIcon} from "./arrow-down";
import {ArrowUpIcon} from "./arrow-up";

import {useMemoizedCallback} from "./use-memoized-callback";

import {columns, INITIAL_VISIBLE_COLUMNS, fetchUserInfo, roleOptions, departmentOptions} from "./data";
import {Status} from "./Status";

const newColumns = [
  { uid: "first_name", name: "First Name" },
  { uid: "last_name", name: "Last Name" },
  { uid: "staffID", name: "Staff ID" },
  { uid: "email", name: "Email" },
  { uid: "role", name: "Role" },
  { uid: "department", name: "Department" },
  { uid: "actions", name: "Actions" },
];

export default function ManageUsersTable() {
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "first_name",
    direction: "ascending",
  });

  const [workerTypeFilter, setWorkerTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [allUsers, setAllUsers] = useState<Users[]>([]);

  const navigate = useNavigate();

  // Check user's privilege (must be admin)
  useEffect(() => {
    const checkPrivileges = () => {
        const user = localStorage.getItem("user");
        console.log(user);
        if (user) {
            const parsedUser = JSON.parse(user);
            if (parsedUser.role != "admin") {
                // Navigate to correct dashboard
                if (parsedUser.role == "manager") {
                    navigate("/manager_dashboard");
                } else if (parsedUser.role == "staff") {
                    navigate("/staff_dashboard");
                }
            }
        } else {
            alert("Not logged in");
            navigate("/");
        }
    }
    checkPrivileges();
}, [navigate]);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await fetchUserInfo();
        setAllUsers(usersData);
      } catch (error) {
        console.error('Fetching user info failed:', error);
      }
    };

    fetchData();
  }, []);

  const headerColumns = useMemo(() => {
    if (visibleColumns === "all") return newColumns;

    return newColumns
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

  const itemFilter = useCallback(
    (user: Users) => {
      const allWorkerType = workerTypeFilter === "all";
      const allStatus = statusFilter === "all";
      const allDepartment = departmentFilter === "all";

      return (
        (allWorkerType || workerTypeFilter === user.role.toLowerCase()) &&
        (allDepartment || departmentFilter === user.department.toLowerCase())
      );
    },
    [workerTypeFilter, departmentFilter],
  );

  
  const filteredItems = useMemo(() => {
    let filteredUsers = [...allUsers];

    if (filterValue) {
      filteredUsers = filteredUsers.filter((user) =>
        user.first_name.toLowerCase().includes(filterValue.toLowerCase()) ||
        user.last_name.toLowerCase().includes(filterValue.toLowerCase()) ||
        user.email.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    const result = filteredUsers.filter(itemFilter);
    return result;
  }, [filterValue, itemFilter, allUsers]);

  const sortedItems = useMemo(() => {
    const result = [...filteredItems].sort((a: Users, b: Users) => {
      const col = sortDescriptor.column as keyof Users;

      let first = a[col];
      let second = b[col];

      if (col === "first_name") {
        first = a.first_name.toLowerCase();
        second = b.first_name.toLowerCase();
      } else if (col === "last_name") {
        first = a.last_name.toLowerCase();
        second = b.last_name.toLowerCase();
      } else if (col === "staffID") {
        first = Number(a.staffID);
        second = Number(b.staffID);
      } else if (typeof first === 'string' && typeof second === 'string') {
        first = first.toLowerCase();
        second = second.toLowerCase();
      }

      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
    return result;
  }, [sortDescriptor, filteredItems]);

  const pages = Math.ceil(sortedItems.length / rowsPerPage) || 1;

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const result = sortedItems.slice(start, end);
    return result;
  }, [page, sortedItems, rowsPerPage]);

  const filterSelectedKeys = useMemo(() => {
    if (selectedKeys === "all") return selectedKeys;
    let resultKeys = new Set<Key>();

    if (filterValue) {
      filteredItems.forEach((item) => {
        const stringId = String(item.user_id);

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
  const getMemberInfoProps = useMemoizedCallback(() => ({
    onClick: handleMemberClick,
  }));

  const renderCell = useMemoizedCallback((user: Users, columnKey: React.Key) => {
    const userKey = columnKey as ColumnsKey;

    switch (userKey) {
      case "first_name":
        return <div className="text-default-foreground">{user.first_name}</div>;
      case "last_name":
        return <div className="text-default-foreground">{user.last_name}</div>;
      case "staffID":
        return <div className="text-default-foreground">{user.user_id}</div>;
      case "email":
        return <div className="text-default-foreground">{user.email}</div>;
      case "role":
        return <div className="text-default-foreground">{user.role}</div>;
      case "department":
        return <div className="text-default-foreground">{user.department}</div>;
      case "actions":
        return (
          <div className="flex items-center justify-end gap-2">
            <EditLinearIcon
              {...getEditProps()}
              className="cursor-pointer text-default-400"
              height={18}
              width={18}
              onClick={() => navigate(`/admin_dashboard/edit_user/${user.user_id}`)}
            />
            <DeleteFilledIcon
              {...getDeleteProps()}
              className="cursor-pointer text-default-400"
              height={18}
              width={18}
              onClick={() => confirmDelete(user, fetchUserInfo)}
            />
          </div>
        );
      default:
        return null;
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
        const resultKeys = new Set(filteredItems.map((item) => String(item.user_id)));

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
          ? new Set(filteredItems.map((item) => String(item.user_id)))
          : selectedKeys;

      selectedValue.forEach((v) => {
        if (items.some((item) => String(item.user_id) === v)) {
          return;
        }
        resultKeys.add(v);
      });
      setSelectedKeys(new Set(resultKeys));
    }
  });

  const topContent = useMemo(() => {
    return (
      <div className="flex items-center gap-4 overflow-auto px-[6px] py-[4px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            <Input
              className="min-w-[200px]"
              endContent={<SearchIcon className="text-default-400" width={16} />}
              placeholder="Search By Name or Email"
              size="sm"
              value={filterValue}
              onValueChange={onSearchChange}
            />
            <div>
              <Popover placement="bottom">
                <PopoverTrigger>
                  <Button
                    className="bg-default-100 text-default-800"
                    size="sm"
                    startContent={
                      <Icon className="text-default-400" icon="solar:tuning-2-linear" width={16} />
                    }
                  >
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="flex w-full flex-col gap-6 px-2 py-4">
                    <RadioGroup
                      label="Role"
                      value={workerTypeFilter}
                      onValueChange={setWorkerTypeFilter}
                    >
                      {roleOptions.map((role) => (
                        <Radio key={role.uid} value={role.uid}>
                          {role.name}
                        </Radio>
                      ))}
                    </RadioGroup>

                    <RadioGroup
                      label="Department"
                      value={departmentFilter}
                      onValueChange={setDepartmentFilter}
                    >
                      {departmentOptions.map((department) => (
                        <Radio key={department.uid} value={department.uid}>
                          {department.name}
                        </Radio>
                      ))}
                    </RadioGroup>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
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
                  items={headerColumns.filter((c) => !["actions"].includes(c.uid))}
                >
                  {(item) => (
                    <DropdownItem
                      key={item.uid}
                      onPress={() => {
                        setSortDescriptor({
                          column: item.uid,
                          direction:
                            sortDescriptor.direction === "ascending" ? "descending" : "ascending",
                        });
                      }}
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
                <DropdownItem key="send-email">Send email</DropdownItem>
                <DropdownItem key="pay-invoices">Pay invoices</DropdownItem>
                <DropdownItem key="bulk-edit">Bulk edit</DropdownItem>
                <DropdownItem key="end-contract">End contract</DropdownItem>
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
    workerTypeFilter,
    departmentFilter,
    setWorkerTypeFilter,
    setDepartmentFilter,
    onSearchChange,
    setVisibleColumns,
  ]);

  const topBar = useMemo(() => {
    return (
      <div className="mb-[18px] flex items-center justify-between dark:text-white" style={{ marginTop: '40px' }}>
        <div className="flex w-[226px] items-center gap-2">
          <h1 className="text-2xl font-[700] leading-[32px] dark:text-white">Staff</h1>
          <Chip className="hidden items-center text-default-500 dark:text-gray-300 sm:flex" size="sm" variant="flat">
            {allUsers.length}
          </Chip>
        </div>
        <Button
          className="bg-black text-white dark:bg-gray-700 dark:text-white"
          endContent={<Icon icon="solar:add-circle-bold" width={20} />}
          onPress={() => navigate('/admin_dashboard/add_users')}
        >
          Add New Staff
        </Button>
      </div>
    );
  }, [allUsers.length, navigate]);

  const bottomContent = useMemo(() => {
    return (
      <div className="flex flex-col items-center justify-between gap-2 px-2 py-2 sm:flex-row dark:text-white">
          <Pagination
                                   total={pages}
                                 initialPage={1}
                                
                                 onChange={setPage}
                                 classNames={{
                                   item: "bg-white text-black dark:bg-gray-700 dark:text-white",
                                   cursor: "bg-black text-white dark:bg-blue-600 dark:text-white",
                                 }}
                               />
        <div className="flex items-center justify-end gap-6">
          <span className="text-small text-default-400 dark:text-gray-400">
            {filterSelectedKeys === "all"
              ? "All items selected"
              : `${filterSelectedKeys.size} of ${filteredItems.length} selected`}
          </span>
          <div className="flex items-center gap-3">
            <Button 
              isDisabled={page === 1} 
              size="sm" 
              variant="flat" 
              className="dark:bg-gray-700 dark:text-white"
              onPress={onPreviousPage}
            >
              Previous
            </Button>
            <Button 
              isDisabled={page === pages} 
              size="sm" 
              variant="flat" 
              className="dark:bg-gray-700 dark:text-white"
              onPress={onNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  }, [filterSelectedKeys, page, pages, filteredItems.length, onPreviousPage, onNextPage]);

  return (
    <div className="dark:bg-gray-900 min-h-screen" style={{ marginTop: "-80px" }}> 
      <NavBar />
      <SideBar />
      <div className="flex-1 p-6 dark:bg-gray-900" style={{ padding: '40px' }}>
        {topBar}
        <Table
          isHeaderSticky
          aria-label="Example table with custom cells, pagination and sorting"
          bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            wrapper: "dark:bg-gray-800",
            th: "dark:bg-gray-800 dark:text-white",
            tr: "dark:bg-gray-800 dark:hover:bg-gray-700",
            td: "before:bg-transparent dark:text-white",
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
              {column.uid === "memberInfo" ? (
                <div
                  {...getMemberInfoProps()}
                  className="flex w-full cursor-pointer items-center justify-between"
                >
                  {column.name}
                  {sortDescriptor.column === column.uid && sortDescriptor.direction === "ascending" ? (
                    <ArrowUpIcon className="text-default-400" />
                  ) : (
                    <ArrowDownIcon className="text-default-400" />
                  )}
                </div>
              ) : (
                column.name
              )}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={"No items found"} items={items}>
          {(item) => {
            return (
              <TableRow key={item.user_id}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            );
          }}
        </TableBody>
      </Table>
      <ToastContainer />
    </div>
    </div>
  );

}
