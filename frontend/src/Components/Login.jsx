import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";

const Login = () => {
  const [formData, setFormData] = useState({ mobile_number: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/login`, formData);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setSuccessMessage("Login successful! Redirecting to homepage...");
      setTimeout(() => {
        navigate("/homepage");
        window.location.reload();
      }, 1500);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setServerError("User not found. Redirecting to signup...");
        setTimeout(() => {
          navigate("/signup");
        }, 1500);
      } else {
        setServerError("Login failed. Please check your credentials.");
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  return (
    <div className="container mt-4">
      <h2>Login</h2>
      <Form onSubmit={handleSubmit}>
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

        {serverError && <Alert variant="danger">{serverError}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        <Button variant="primary" type="submit">Log In</Button>
      </Form>
      <div className="mt-3 text-center">
        <p>Don't have an account? <Link to="/signup">Sign up here</Link>.</p>
      </div>
    </div>
  );
};

export default Login;
