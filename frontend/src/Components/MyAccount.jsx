import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Alert, Container, Spinner, Button } from "react-bootstrap";
import { FaFacebookF, FaWhatsapp, FaTwitter } from "react-icons/fa"; // Import icons

const MyAccount = () => {
  const [user, setUser] = useState({ username: "", email: "", wallet: 0, user_id: 0, referral_code: "", mobile_number: "" });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get("http://localhost:5001/get-user", {
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
      await axios.put("http://localhost:5001/update-user", user, {
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

  const handleShare = (platform) => {
    const referralMessage = `Check out this app! Use my referral code ${user.referral_code} to sign up.`;
    const currentUrl = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(referralMessage);

    switch (platform) {
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`, "_blank");
        break;
      case "whatsapp":
        window.open(`https://api.whatsapp.com/send?text=${text} ${currentUrl}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${currentUrl}&text=${text}`, "_blank");
        break;
      default:
        break;
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

        <Form.Group controlId="formMobileNumber" className="mt-3">
          <Form.Label>Mobile Number</Form.Label>
          <Form.Control type="text" value={user.mobile_number} readOnly />
        </Form.Group>

        <Form.Group controlId="formWallet" className="mt-3">
          <Form.Label>Wallet Balance</Form.Label>
          <Form.Control type="text" value={`$${user.wallet.toFixed(2)}`} readOnly />
        </Form.Group>

        <Form.Group controlId="formReferralCode" className="mt-3">
          <Form.Label>Referral Code</Form.Label>
          <Form.Control type="text" value={user.referral_code} readOnly />
        </Form.Group>

        <Button variant="primary" onClick={handleSaveChanges} className="mt-3" disabled={saving}>
          {saving ? <Spinner animation="border" size="sm" /> : "Save Changes"}
        </Button>
      </Form>

      {/* Social Media Share Icons */}
      <div className="mt-4">
        <h5>Share your referral code:</h5>
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <FaFacebookF
            size={30}
            color="#3b5998"
            style={{ cursor: "pointer" }}
            onClick={() => handleShare("facebook")}
          />
          <FaWhatsapp
            size={30}
            color="#25D366"
            style={{ cursor: "pointer" }}
            onClick={() => handleShare("whatsapp")}
          />
          <FaTwitter
            size={30}
            color="#1DA1F2"
            style={{ cursor: "pointer" }}
            onClick={() => handleShare("twitter")}
          />
        </div>
      </div>
    </Container>
  );
};

export default MyAccount;
