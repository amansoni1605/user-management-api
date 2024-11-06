import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Container, Alert, Button, Form, Card, Tabs, Tab } from "react-bootstrap";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [packageSales, setPackageSales] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [walletUpdate, setWalletUpdate] = useState({});
  const [newPackage, setNewPackage] = useState({
    name: "",
    description: "",
    investment_amount: "",
    earnings_per_day: "",
    earnings_days: "",
    total_earnings: "",
    maximum_purchase: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchUsers();
    fetchPackages();
    fetchPackageSales();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5001/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const usersWithReferralCount = res.data.map((user) => {
        const referralCount = res.data.filter(u => u.referred_by === user.referral_code).length;
        return {
          ...user,
          wallet: parseFloat(user.wallet),
          referral_count: referralCount,
        };
      });

      setUsers(usersWithReferralCount);
    } catch (err) {
      setError("Failed to fetch users. Make sure you have admin access.");
    }
  };

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5001/admin/packages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPackages(res.data);
    } catch (err) {
      setError("Failed to fetch packages.");
    }
  };

  const fetchPackageSales = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5001/admin/package-sales", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPackageSales(res.data);
    } catch (err) {
      setError("Failed to fetch package sales.");
    }
  };

  const handleWalletChange = (id, value) => {
    setWalletUpdate({ ...walletUpdate, [id]: value });
    setSuccess("");
  };

  const updateWallet = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5001/admin/update-wallet/${id}`,
        { wallet: walletUpdate[id] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchUsers();
      setWalletUpdate((prev) => ({ ...prev, [id]: "" }));
      setSuccess("Wallet balance updated successfully.");
    } catch (err) {
      console.error("Failed to update wallet balance:", err);
      setError("Failed to update wallet balance. Please try again.");
    }
  };

  const handleNewPackageChange = (e) => {
    const { name, value } = e.target;
    setNewPackage((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addPackage = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5001/admin/add-package", newPackage, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPackages((prev) => [...prev, res.data]);
      setNewPackage({
        name: "",
        description: "",
        investment_amount: "",
        earnings_per_day: "",
        earnings_days: "",
        total_earnings: "",
        maximum_purchase: 0,
        is_active: true,
      });
      setSuccess("Package added successfully.");
    } catch (err) {
      setError("Failed to add package. Please try again.");
    }
  };

  return (
    <Container className="mt-4">
      <h2>Admin Panel</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <Card.Body>
          <Tabs defaultActiveKey="users" id="admin-tabs" className="mb-3">
            <Tab eventKey="users" title="Users">
              <h3>User List</h3>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Admin</th>
                    <th>Wallet Balance</th>
                    <th>Mobile Number</th>
                    <th>Referral Code</th>
                    <th>Referred By</th>
                    <th>Update Wallet</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username} ({user.referral_count} refer)</td>
                      <td>{user.email}</td>
                      <td>{user.isadmin ? "Yes" : "No"}</td>
                      <td>${user.wallet.toFixed(2)}</td>
                      <td>{user.mobile_number}</td>
                      <td>{user.referral_code}</td>
                      <td>{user.referred_by || "N/A"}</td>
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
            </Tab>

            <Tab eventKey="packages" title="Packages">
              <h3>Package List</h3>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Investment Amount</th>
                    <th>Daily Earnings</th>
                    <th>Earnings Days</th>
                    <th>Total Earnings</th>
                    <th>Max Purchase</th>
                    <th>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg.package_id}>
                      <td>{pkg.package_id}</td>
                      <td>{pkg.name}</td>
                      <td>{pkg.description || "N/A"}</td>
                      <td>₹{pkg.investment_amount}</td>
                      <td>₹{pkg.earnings_per_day}</td>
                      <td>{pkg.earnings_days}</td>
                      <td>₹{pkg.total_earnings}</td>
                      <td>{pkg.maximum_purchase === 0 ? "Unlimited" : pkg.maximum_purchase}</td>
                      <td>{pkg.is_active ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <h3>Add New Package</h3>
              <Form onSubmit={addPackage}>
                <Form.Group className="mb-3" controlId="packageName">
                  <Form.Label>Package Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter package name"
                    name="name"
                    value={newPackage.name}
                    onChange={handleNewPackageChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="packageDescription">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Enter package description"
                    name="description"
                    value={newPackage.description}
                    onChange={handleNewPackageChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="investmentAmount">
                  <Form.Label>Investment Amount</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter investment amount"
                    name="investment_amount"
                    value={newPackage.investment_amount}
                    onChange={handleNewPackageChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="earningsPerDay">
                  <Form.Label>Daily Earnings</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter daily earnings"
                    name="earnings_per_day"
                    value={newPackage.earnings_per_day}
                    onChange={handleNewPackageChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="earningsDays">
                  <Form.Label>Earnings Days</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter earnings days"
                    name="earnings_days"
                    value={newPackage.earnings_days}
                    onChange={handleNewPackageChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="totalEarnings">
                  <Form.Label>Total Earnings</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter total earnings"
                    name="total_earnings"
                    value={newPackage.total_earnings}
                    onChange={handleNewPackageChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="maxPurchase">
                  <Form.Label>Max Purchase</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter max purchase"
                    name="maximum_purchase"
                    value={newPackage.maximum_purchase}
                    onChange={handleNewPackageChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="isActive">
                  <Form.Check
                    type="checkbox"
                    label="Active"
                    name="is_active"
                    checked={newPackage.is_active}
                    onChange={handleNewPackageChange}
                  />
                </Form.Group>

                <Button variant="primary" type="submit">
                  Add Package
                </Button>
              </Form>
            </Tab>

            {/* Package Sales List */}
            <Tab eventKey="sales" title="Package Sales">
              <h3>Package Sales</h3>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Package ID</th>
                    <th>Package Name</th>
                    <th>Total Investment</th>
                    <th>Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {packageSales.map((sale) => (
                    <tr key={sale.package_id}>
                      <td>{sale.package_id}</td>
                      <td>{sale.name}</td>
                      <td>₹{parseFloat(sale.total_investment).toFixed(2)}</td>
                      <td>{sale.total_sales}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminPanel;
s