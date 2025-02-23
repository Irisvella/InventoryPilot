import type { NavbarProps } from "@nextui-org/react";
import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from "react";
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
} from "@nextui-org/react";

export default function NavBar(props: NavbarProps) {
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
        <NavbarItem>
          <Link className="text-default-500" href="/dashboard" size="sm">
            Dashboard
          </Link>
        </NavbarItem>

        {(userRole === "admin") && (
          <>
            <NavbarItem><Link className="text-default-500" href="/kpi" size="sm">KPI</Link></NavbarItem>
            <NavbarItem><Link className="text-default-500" href="/orders" size="sm">Orders</Link></NavbarItem>
            <NavbarItem><Link className="text-default-500" href="/inventory-stock" size="sm">Inventory</Link></NavbarItem>
            <NavbarItem><Link className="text-default-500" href="/manufacturing_tasks" size="sm">Manufacturing Tasks</Link></NavbarItem>
          </>
        )}

        {(userRole === "manager") && (
          <>
            <NavbarItem><Link className="text-default-500" href="/kpi" size="sm">KPI</Link></NavbarItem>
            <NavbarItem><Link className="text-default-500" href="/orders" size="sm">Orders</Link></NavbarItem>
            <NavbarItem><Link className="text-default-500" href="/inventory-stock" size="sm">Inventory</Link></NavbarItem>
            <NavbarItem><Link className="text-default-500" href="/qa_error_list_view" size="sm">QA Error Reports</Link></NavbarItem>
            <NavbarItem><Link className="text-default-500" href="/manufacturing_tasks" size="sm">Manufacturing Tasks</Link></NavbarItem>
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
            <NavbarItem><Link className="text-default-500" href="/qa_tasks" size="sm">QA Tasks</Link></NavbarItem>
            <NavbarItem><Link className="text-default-500" href="/qa_error_list_view" size="sm">Error Reports</Link></NavbarItem>
          </>
        )}

        {/* Account & Logout/Login Button */}
        {userRole && <NavbarItem><Link className="text-default-500" href="/account_management" size="sm">Account</Link></NavbarItem>}

        <NavbarItem className="ml-2 !flex">
          {userRole ? (
            <Button radius="full" variant="flat" onPress={handleLoginAsDifferentUser}>Logout</Button>
          ) : (
            <Button radius="full" variant="flat" onPress={() => navigate("/login")}>Login</Button>
          )}
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
