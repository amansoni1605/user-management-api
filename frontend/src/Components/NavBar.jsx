import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar, Nav, Button, Alert } from "react-bootstrap";

const NavBar = ({ setIsAuthenticated }) => {
  const [user, setUser] = useState(null);
  const [logoutMessage, setLogoutMessage] = useState(""); // State for logout message
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);

    setLogoutMessage("You have been logged out successfully.");
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      navigate("/login");
      setLogoutMessage(""); // Clear logout message
    }, 1500);
  };

  return (
    <>
      <Navbar bg="light" expand="lg" className="px-4">
        <Navbar.Brand as={Link} to="/">MyApp</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ml-auto">
            <Nav.Link as={Link} to="/homepage">Homepage</Nav.Link>
            <Nav.Link as={Link} to="/myaccount">My Account</Nav.Link>
            <Nav.Link as={Link} to="/products">Products</Nav.Link>
            
            {user?.isadmin && <Nav.Link as={Link} to="/admin">Admin Panel</Nav.Link>}

            {!user ? (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/signup">Signup</Nav.Link>
              </>
            ) : (
              <Button variant="link" onClick={logout}>Logout</Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      {/* Display logout message */}
      {logoutMessage && <Alert variant="success" className="mt-3">{logoutMessage}</Alert>}
    </>
  );
};

export default NavBar;
