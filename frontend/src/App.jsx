import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import Homepage from "./Components/Homepage";
import AdminPanel from "./Components/Adminpanel";
import NavBar from "./Components/NavBar";
import "bootstrap/dist/css/bootstrap.min.css";
import MyAccount from "./Components/MyAccount";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if token exists in local storage on load
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  return (
    <Router>
      <div>
        {/* Conditionally render NavBar only if authenticated */}
        {isAuthenticated && <NavBar setIsAuthenticated={setIsAuthenticated} />}

        <Routes>
          {/* Public routes for unauthenticated users */}
          {!isAuthenticated && (
            <>
              <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/signup" element={<Signup />} />
              {/* Redirect to /login if accessing other routes without authentication */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}

          {/* Private routes for authenticated users */}
          {isAuthenticated && (
            <>
              <Route path="/" element={<Homepage />} />
              <Route path="/homepage" element={<Homepage />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/myaccount" element={<MyAccount />} />
              {/* Redirect /login to / if already authenticated */}
              <Route path="/login" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
