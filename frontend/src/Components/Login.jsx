import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";

const Login = () => {
  const [formData, setFormData] = useState({ mobile_number: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); // State for success message
  const navigate = useNavigate();

  // Validate form fields
  const validate = () => {
    const newErrors = {};
    if (!formData.mobile_number || isNaN(formData.mobile_number)) {
      newErrors.mobile_number = "A valid mobile number is required";
    }
    if (!formData.password || formData.password.length <= 3) {
      newErrors.password = "Password must be at least 4 characters long";
    }
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5001/login", formData);
      localStorage.setItem("token", res.data.token); // Store token
      localStorage.setItem("user", JSON.stringify(res.data.user)); // Store user details
      setSuccessMessage("Login successful! Redirecting to homepage..."); // Set success message
      setTimeout(() => {
        navigate("/homepage"); // Redirect to homepage after a brief delay
        window.location.reload();
      }, 1500); // Delay for user to see the success message
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setServerError("User not found. Redirecting to signup...");
        setTimeout(() => {
          navigate("/signup"); // Redirect to signup if user is not found
        }, 1500); // Adding delay to display the error message
      } else {
        setServerError("Login failed. Please check your credentials.");
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null }); // Clear error on change
    }
  };

  return (
    <div className="container mt-4">
      <h2>Login</h2>
      <Form onSubmit={handleSubmit}>
        {/* Mobile Number Field */}
        <Form.Group className="mb-3" controlId="formMobileNumber">
          <Form.Label>Mobile Number</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter mobile number"
            name="mobile_number"
            value={formData.mobile_number}
            onChange={handleChange}
            isInvalid={!!errors.mobile_number}
          />
          <Form.Control.Feedback type="invalid">{errors.mobile_number}</Form.Control.Feedback>
        </Form.Group>

        {/* Password Field */}
        <Form.Group className="mb-3" controlId="formPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            isInvalid={!!errors.password}
          />
          <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
        </Form.Group>

        {/* Display server error message */}
        {serverError && <Alert variant="danger">{serverError}</Alert>}
        
        {/* Display success message */}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        {/* Submit Button */}
        <Button variant="primary" type="submit">
          Log In
        </Button>
      </Form>
      <div className="mt-3 text-center">
        <p>Don't have an account? <Link to="/signup">Sign up here</Link>.</p>
      </div>
    </div>
  );
};

export default Login;
