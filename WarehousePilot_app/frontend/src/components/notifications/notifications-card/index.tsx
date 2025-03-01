
import React from "react";
import ReactDOM from "react-dom/client";
import {HeroUIProvider} from "@heroui/react";
import App from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HeroUIProvider>
      <div className="w-screen h-screen p-8 flex items-start justify-center">
        <App />
      </div>
    </HeroUIProvider>
  </React.StrictMode>
  );
}