import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Container, Alert, Button, Form } from "react-bootstrap";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [walletUpdate, setWalletUpdate] = useState({});
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Convert wallet to a number for each user
        const usersWithNumericWallet = res.data.map((user) => ({
          ...user,
          wallet: parseFloat(user.wallet), // Ensure wallet is a number
        }));
        setUsers(usersWithNumericWallet); // Update state with converted data
      } catch (err) {
        setError("Failed to fetch users. Make sure you have admin access.");
      }
    };

    fetchUsers();
  }, []);

  const handleWalletChange = (id, value) => {
    setWalletUpdate({ ...walletUpdate, [id]: value });
    setSuccess(""); // Clear success message on input change
  };

  const updateWallet = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/admin/update-wallet/${id}`,
        { wallet: walletUpdate[id] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Re-fetch the updated user list to ensure frontend syncs with the backend
      const res = await axios.get("http://localhost:5000/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUsers = res.data.map((user) => ({
        ...user,
        wallet: parseFloat(user.wallet),
      }));
      setUsers(updatedUsers);
      setWalletUpdate((prev) => ({ ...prev, [id]: "" })); // Clear input field
      setSuccess("Wallet balance updated successfully.");
    } catch (err) {
      console.error("Failed to update wallet balance:", err);
      setError("Failed to update wallet balance. Please try again.");
    }
  };

  return (
    <Container className="mt-4">
      <h2>Admin Panel - User List</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Admin</th>
            <th>Wallet Balance</th>
            <th>Update Wallet</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.isadmin ? "Yes" : "No"}</td>
              <td>${user.wallet.toFixed(2)}</td> {/* Render wallet with 2 decimal places */}
              <td>
                <Form.Control
                  type="number"
                  placeholder="Update wallet"
                  value={walletUpdate[user.id] || ""}
                  onChange={(e) => handleWalletChange(user.id, parseFloat(e.target.value))}
                />
                <Button
                  variant="primary"
                  onClick={() => updateWallet(user.id)}
                  className="mt-2"
                >
                  Update
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default AdminPanel;
