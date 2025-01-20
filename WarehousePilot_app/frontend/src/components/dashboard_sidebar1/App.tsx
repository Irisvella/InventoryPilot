"use client";

import React from "react";
import {
  Avatar,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ScrollShadow,
  Spacer,
  useDisclosure,
} from "@nextui-org/react";
import {Icon} from "@iconify/react";

import {items} from "./sidebar-items";
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
  const token = localStorage.getItem("token");
  console.log("Token from localStorage:", token); // Debugging

  return (
    <div style={{ width: '0px',  height: '0px' }}> 
      <Modal
        classNames={{
          base: "justify-start sm:m-0 p-0 h-dvh max-h-full w-[var(--sidebar-width)]",
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
            <div className="relative flex h-full w-72 flex-1 flex-col p-6">
              <div className="flex items-center gap-2 px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground">
                  {/* ICON LOGO className="text-background" /> */}
                </div>
                <span className="text-small font-bold uppercase text-foreground">CSF</span>
              </div>
              <Spacer y={8} />
              <div className="flex items-center gap-3 px-3">
                <Avatar
                  isBordered
                  size="sm"
                  src=""
                />
                <div className="flex flex-col">
                  <p className="text-small font-medium text-default-600">John Doe</p>
                  <p className="text-tiny text-default-400">Manager</p>
                </div>
              </div>

              <ScrollShadow className="-mr-6 h-full max-h-full py-6 pr-6">
                <Sidebar defaultSelectedKey="dashboard" items={items} />
              </ScrollShadow>

              <Spacer y={8} />
              <div className="mt-auto flex flex-col">
              <Button
                  className="justify-start text-default-500 data-[hover=true]:text-foreground"
                  startContent={
                    <Icon
                      className="text-default-500"
                      icon="solar:users-group-rounded-outline"
                      width={24}
                    />
                  }
                  variant="light"
                  onPress={navigatetoUsers}
                >
                 Users
                </Button>
                <Button
                  className="justify-start text-default-500 data-[hover=true]:text-foreground"
                  startContent={
                    <Icon
                      className="rotate-180 text-default-500"
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
          <Button isIconOnly size="sm" variant="light" onPress={onOpen} style={{ marginRight: '30px' }}>
            <Icon
              className="text-default-500"
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
