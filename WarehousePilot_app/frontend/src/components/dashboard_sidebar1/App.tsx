/* The menu has been tested to change dynamically with each user type*/
"use client";

import React, { useState, useEffect } from "react";
import {
  Avatar,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ScrollShadow,
  Spacer,
  useDisclosure,
} from "@heroui/react";
import {Icon} from "@iconify/react";

import {getSidebarItems} from "./sidebar-items";
import { CsfIcon } from "./csf";

import Sidebar from "./sidebar";

import { useNavigate } from 'react-router-dom';

export default function SideBar() {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const navigate = useNavigate();
  const sidebarWidth = 288;

  const navigatetoUsers = () => {
    navigate('/admin_dashboard/manage_users');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };
  const [user, setUser] = useState({ name: '', role: '' });
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({ name: parsedUser.first_name, role: parsedUser.role });
    }
  }, []);
  const token = localStorage.getItem("token");
  console.log("Token from localStorage:", token); // Debugging

  return (
    <div style={{ width: '0px', height: '0px' }}> 
      <Modal
        classNames={{
          base: "justify-start sm:m-0 p-0 h-dvh max-h-full w-[var(--sidebar-width)] dark:bg-gray-900",
          wrapper: "items-start justify-start !w-[var(--sidebar-width)]",
          body: "p-0",
          closeButton: "z-50",
        }}
        isOpen={isOpen}
        motionProps={{
          variants: {
            enter: {
              x: 0,
              transition: {
                duration: 0.3,
                ease: "easeOut",
              },
            },
            exit: {
              x: -288,
              transition: {
                duration: 0.2,
                ease: "easeOut",
              },
            },
          },
        }}
        radius="none"
        scrollBehavior="inside"
        style={{
          // @ts-ignore
          "--sidebar-width": `${sidebarWidth}px`,
        }}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          <ModalBody>
            <div className="relative flex h-full w-72 flex-1 flex-col p-6 dark:bg-gray-900">
              <div className="flex items-center gap-2 px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground dark:bg-gray-700">
                  <CsfIcon className="text-background dark:text-white" />
                </div>
                <span className="text-small font-bold uppercase text-foreground dark:text-white">CSF</span>
              </div>
              <Spacer y={8} />
              <div className="flex items-center gap-3 px-3">
                <Avatar
                  isBordered
                  size="sm"
                  src=""
                />
                <div className="flex flex-col">
                  <p className="text-small font-medium text-default-600 dark:text-gray-300">{user.name}</p>
                  <p className="text-tiny text-default-400 dark:text-gray-400">{user.role}</p>
                </div>
              </div>

              <ScrollShadow className="-mr-6 h-full max-h-full py-6 pr-6 dark:[&>div]:bg-gray-900">
                <Sidebar defaultSelectedKey="dashboard" items={getSidebarItems()} />
              </ScrollShadow>

              <Spacer y={8} />
              <div className="mt-auto flex flex-col">
                {(user?.role === 'admin') && (
                  <Button
                    className="justify-start text-default-500 data-[hover=true]:text-foreground dark:text-gray-300 dark:data-[hover=true]:text-white"
                    startContent={
                      <Icon
                        className="text-default-500 dark:text-gray-400"
                        icon="solar:users-group-rounded-outline"
                        width={24}
                      />
                    }
                    variant="light"
                    onPress={navigatetoUsers}
                  >
                    Users
                  </Button>
                )}
                <Button
                  className="justify-start text-default-500 data-[hover=true]:text-foreground dark:text-gray-300 dark:data-[hover=true]:text-white"
                  startContent={
                    <Icon
                      className="rotate-180 text-default-500 dark:text-gray-400"
                      icon="solar:minus-circle-line-duotone"
                      width={24}
                    />
                  }
                  variant="light"
                  onPress={handleLogout}
                >
                  Log Out
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
      <div className="w-full flex-1 flex-col p-4">
        <header className="flex items-center gap-3 rounded-medium p-4">
          <Button 
            isIconOnly 
            size="sm" 
            variant="light" 
            onPress={onOpen} 
            style={{ zIndex: 50 }}
            className="dark:text-white dark:hover:bg-gray-800"
          >
            <Icon
              className="text-default-500 dark:text-gray-300"
              height={24}
              icon="solar:hamburger-menu-outline"
              width={24}
            />
          </Button>
        </header>
      </div>
    </div>
  );
}