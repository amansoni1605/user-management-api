import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Button, Container, Row, Col, Alert } from "react-bootstrap";

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch packages from the backend
    const fetchPackages = async () => {
      try {
        const res = await axios.get("http://localhost:5001/packages"); // Ensure the correct port
        setPackages(res.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load packages. Please try again later.");
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handleBuyPackage = async (packageId, investmentAmount) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5001/buy-package",
        { package_id: packageId, investment_amount: parseFloat(investmentAmount) }, // Ensure it's a float
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess("Package purchased successfully! Your wallet has been updated.");
      setError(""); // Clear any previous errors
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to purchase package. Please check your wallet balance or try again later.";
      setError(errorMessage);
      setSuccess(""); // Clear success message if an error occurs
    }
  };

  if (loading) return <Alert variant="info">Loading packages...</Alert>;

  return (
    <Container className="mt-4">
      <h2>Available Packages</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <Row>
        {packages.map((pkg) => (
          <Col md={4} key={pkg.package_id} className="mb-4">
            <Card>
              <Card.Body>
                {pkg.is_active && (
                  <div className="text-success font-weight-bold mb-2">Active</div>
                )}
                <Card.Title>{pkg.name}</Card.Title>
                <Card.Text>
                  <strong>Description:</strong> {pkg.description || "No description available."}
                </Card.Text>
                <Card.Text>
                  <strong>Investment Amount:</strong> ₹{pkg.investment_amount}
                </Card.Text>
                <Card.Text>
                  <strong>Daily Earnings:</strong> ₹{pkg.earnings_per_day}
                </Card.Text>
                <Card.Text>
                  <strong>Total Earnings:</strong> ₹{pkg.total_earnings}
                </Card.Text>
                <Card.Text>
                  <strong>Earnings Duration:</strong> {pkg.earnings_days} days
                </Card.Text>
                <Card.Text>
                  <strong>Maximum Purchase:</strong>{" "}
                  {pkg.maximum_purchase === 0 ? "Unlimited" : pkg.maximum_purchase}
                </Card.Text>
                <Button
                  variant="primary"
                  onClick={() => handleBuyPackage(pkg.package_id, pkg.investment_amount)}
                >
                  Buy Now
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Packages;
    