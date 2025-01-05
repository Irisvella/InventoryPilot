import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import routes from "./components/routes";  

// Main App Component
function App() {
  return (
    <Router>
      <Routes>
        {/* Map through predefined routes */}
        {routes.map((route, index) => (
          <Route 
            key={index} 
            path={route.path} 
            element={route.element} 
          />
        ))}
  );
}

export default App;
