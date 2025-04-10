/*The dark mode button has been tested */

import type { NavbarProps } from "@heroui/react";
import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import ThemeSwitcher from "../ThemeSwitcher";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  Link,
  Button,
  Tooltip
} from "@heroui/react";

export default function NavBar(props: NavbarProps) {
  // const [isMobile, setIsMobile] = useState(window.innerWidth < 770);
  // useEffect(() => {
  //   const handleResize = () => {
  //     setIsMobile(window.innerWidth < 770);
  //   };

  //   window.addEventListener("resize", handleResize);

  //   return () => {
  //     window.removeEventListener("resize", handleResize);
  //   };
  // }, []);

  // if (isMobile) {
  //   return null; // Return null to hide the navbar on mobile
  // }
  
  
  
  
  const navigate = useNavigate();
  const location = useLocation();

  // State to check if screen is mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Add padding-top when navbar is removed on mobile
  if (isMobile) {
    return <div style={{ marginTop: "60px", paddingTop:"20px" }}></div>;
  }

  // Retrieve user info from localStorage
  const user = localStorage.getItem("user");
  const parsedUser = user ? JSON.parse(user) : null;
  const userRole = parsedUser ? parsedUser.role : null;

  const handleLoginAsDifferentUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="hide-on-mobile">
    <Navbar
      {...props}
      classNames={{
        base: "py-4 backdrop-filter-none bg-transparent",
        wrapper: "px-0 w-full justify-center bg-transparent",
        item: "hidden md:flex",
      }}
      height="54px"
    >
      <NavbarContent
        className="gap-4 rounded-full border-small border-default-200/20 bg-background/60 px-2 shadow-medium backdrop-blur-md backdrop-saturate-150 dark:bg-default-100/50"
        justify="center"
      >
        {/* Toggle for mobile */}
        <NavbarMenuToggle className="ml-2 text-default-400 md:hidden" />

        {/* Logo */}
        <NavbarBrand className="mr-2 w-[40vw] md:w-auto md:max-w-fit">
          <div className="rounded-full bg-foreground text-background">
            {/* <csfLogo size={34} /> */}
          </div>
          <span className="ml-2 font-medium md:hidden">CSF</span>
        </NavbarBrand>

        {/* Conditionally Rendered Navbar Items */}
        <Tooltip content="Dashboard Details">
        <NavbarItem>
            <ThemeSwitcher />
          </NavbarItem>
        <NavbarItem>
          <Link className="text-default-500" href="/dashboard" size="sm">
            Dashboard
          </Link>
        </NavbarItem>
        </Tooltip>

        {(userRole === "admin") && (
          <>
          <Tooltip>
            <ThemeSwitcher/>
          </Tooltip>
            <Tooltip content="View all Key Performance Indicators">
              <NavbarItem><Link className="text-default-500" href="/kpi" size="sm">KPI</Link></NavbarItem>
            </Tooltip>
            <Tooltip content="View and Manage all Orders">
              <NavbarItem><Link className="text-default-500" href="/orders" size="sm">Orders</Link></NavbarItem>
            </Tooltip>
              <NavbarItem><Link className="text-default-500" href="/inventory-stock" size="sm">Inventory</Link></NavbarItem>
            <Tooltip content="View all task details">
              <NavbarItem><Link className="text-default-500" href="/manufacturing_tasks" size="sm">Manufacturing Tasks</Link></NavbarItem>
            </Tooltip>
          </>
        )}

        {(userRole === "manager") && (
          <>
            <Tooltip content="View all Key Performance Indicators">
              <NavbarItem><Link className="text-default-500" href="/kpi" size="sm">KPI</Link></NavbarItem>
            </Tooltip>
            <Tooltip content="View and Manage all Orders">
              <NavbarItem><Link className="text-default-500" href="/orders" size="sm">Orders</Link></NavbarItem>
            </Tooltip>
            <NavbarItem><Link className="text-default-500" href="/inventory-stock" size="sm">Inventory</Link></NavbarItem>
            <Tooltip content="Quality Control Monitoring">
              <NavbarItem><Link className="text-default-500" href="/qa_error_list_view" size="sm">QA Error Reports</Link></NavbarItem>
            </Tooltip>
            <Tooltip content="View all task details">
              <NavbarItem><Link className="text-default-500" href="/manufacturing_tasks" size="sm">Manufacturing Tasks</Link></NavbarItem>
            </Tooltip>
          </>
        )}

        {userRole === "staff" && (
          <>
            <NavbarItem><Link className="text-default-500" href="/staff_manufacturing_tasks" size="sm">Assigned Tasks</Link></NavbarItem>
            <NavbarItem><Link className="text-default-500" href="/assigned_picklist" size="sm">Assigned Picklist</Link></NavbarItem>
          </>
        )}

        {userRole === "qa" && (
          <>
            <Tooltip content="Quality Control Monitoring">
              <NavbarItem><Link className="text-default-500" href="/qa_error_list_view" size="sm">QA Tasks</Link></NavbarItem>
            </Tooltip>
            <Tooltip content="Quality Control Monitoring">
              <NavbarItem><Link className="text-default-500" href="/qa_error_list_view" size="sm">QA Error Reports</Link></NavbarItem>
            </Tooltip>
          </>
        )}

        {/* Account & Logout/Login Button */}
        {userRole && 
        <Tooltip content="Account Management">
          <NavbarItem><Link className="text-default-500" href="/account_management" size="sm">Account</Link>
          </NavbarItem>
        </Tooltip>}
        <NavbarItem className="ml-2 !flex">
          {userRole ? (
            <Button radius="full" variant="flat" onPress={handleLoginAsDifferentUser}>Logout</Button>
          ) : (
            <Button radius="full" variant="flat" onPress={() => navigate("/login")}>Login</Button>
          )}
        </NavbarItem>
      </NavbarContent>
    </Navbar>
    </div>
  );
}
