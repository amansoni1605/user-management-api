import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Button, Alert, Container, Spinner } from "react-bootstrap";

const MyAccount = () => {
  const [user, setUser] = useState({ username: "", email: "", wallet: 0, user_id: 0 });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get("http://localhost:5000/get-user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser({ ...res.data, wallet: parseFloat(res.data.wallet) });
        localStorage.setItem("user", JSON.stringify({ ...res.data, wallet: parseFloat(res.data.wallet) }));
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setErrorMessage("Failed to load user data. Please try again.");
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleNameChange = (e) => {
    setUser({ ...user, username: e.target.value });
    setSuccessMessage("");
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:5000/update-user", user, {
        headers: { Authorization: `Bearer ${token}` },
      });

      localStorage.setItem("user", JSON.stringify(user));
      setSuccessMessage("Profile updated successfully!");
      setErrorMessage("");
    } catch (err) {
      console.error("Failed to update user:", err);
      setErrorMessage("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p>Loading user data...</p>
      </Container>
    );
  }
  return (
    <Container className="mt-4">
      <h2>My Account</h2>
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      <Form>
        <Form.Group controlId="formUserId">
          <Form.Label>User ID</Form.Label>
          <Form.Control type="text" value={user.user_id} readOnly />
        </Form.Group>

        <Form.Group controlId="formUsername">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            value={user.username}
            onChange={handleNameChange}
            placeholder="Enter your name"
          />
        </Form.Group>

        <Form.Group controlId="formWallet" className="mt-3">
          <Form.Label>Wallet Balance</Form.Label>
          <Form.Control
            type="text"
            value={`$${user.wallet.toFixed(2)}`}
            readOnly
          />
        </Form.Group>

        <Button
          variant="primary"
          onClick={handleSaveChanges}
          className="mt-3"
          disabled={saving}
        >
          {saving ? <Spinner animation="border" size="sm" /> : "Save Changes"}
        </Button>
      </Form>
    </Container>
  );
};

export default MyAccount;
