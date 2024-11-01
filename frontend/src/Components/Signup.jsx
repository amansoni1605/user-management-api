import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    mobile_number: "",
    referral_code: ""
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Validate form fields
  const validate = () => {
    const newErrors = {};
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password || formData.password.length <= 3) {
      newErrors.password = "Password must be at least 4 characters long";
    }
    if (!formData.username) {
      newErrors.username = "Username is required";
    }
    if (!formData.mobile_number) {
      newErrors.mobile_number = "A valid mobile number is required";
    }
    if (!formData.referral_code) {
      newErrors.referral_code = "Referral code is required";
    }
    return newErrors;
  };

  // Handle form submission and login user automatically
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/signup", formData);
      localStorage.setItem("token", res.data.token); // Store token
      localStorage.setItem("user", JSON.stringify(res.data.user)); // Store user details
      setLoggedIn(true); // Set user as logged in
    } catch (err) {
      if (err.response && err.response.status === 409) {
        // Check if the error is due to a duplicate mobile number
        const errorMessage = err.response.data.message;
        if (errorMessage.includes("mobile number")) {
          setServerError("This mobile number is already registered. Please use a different number.");
        } else {
          setServerError("You are already registered with this email. Please use the login link below.");
        }
      } else {
        setServerError("Signup failed. Please try again.");
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
      <h2>Signup</h2>
      {loggedIn ? (
        <Alert variant="success">You are successfully signed up and logged in!</Alert>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formUsername">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              isInvalid={!!errors.username}
            />
            <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="formEmail">
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              isInvalid={!!errors.email}
            />
            <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
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

          <Form.Group className="mb-3" controlId="formReferralCode">
            <Form.Label>Referral Code</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter referral code"
              name="referral_code"
              value={formData.referral_code}
              onChange={handleChange}
              isInvalid={!!errors.referral_code}
            />
            <Form.Control.Feedback type="invalid">{errors.referral_code}</Form.Control.Feedback>
          </Form.Group>

          {serverError && <Alert variant="danger">{serverError}</Alert>}
          <Button variant="primary" type="submit">Sign Up</Button>
        </Form>
      )}

      {/* {serverError.includes("already registered") && (
        <div className="mt-3">
          <Alert variant="info">
            <p>You are already registered. <a href="/login">Click here to log in.</a></p>
          </Alert>
        </div>
      )} */}
       <div className="mt-3 text-center">
        <p>Already have an account? <Link to="/login">Log in here</Link>.</p>
      </div>
    </div>
  );
};

export default Signup;
