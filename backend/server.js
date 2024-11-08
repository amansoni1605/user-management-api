require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

// Cron job to update user wallets daily
cron.schedule('0 0 * * *', async () => {
  try {
    const result = await pool.query(`
      UPDATE users u
      SET wallet = wallet + (
        SELECT SUM(pk.earnings_per_day)
        FROM purchases pu
        JOIN packages pk ON pu.package_id = pk.package_id
        WHERE pu.user_id = u.id AND pu.is_active = TRUE
      )
      WHERE EXISTS (
        SELECT 1 FROM purchases pu
        WHERE pu.user_id = u.id AND pu.is_active = TRUE
      )
    `);
    console.log('Wallets updated successfully');
  } catch (error) {
    console.error('Error updating wallets:', error);
  }
});

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Helper function to generate a unique 6-character referral code
const generateReferralCode = async () => {
  let referralCode;
  let isUnique = false;

  while (!isUnique) {
    referralCode = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6-character code
    const existingCode = await pool.query("SELECT * FROM users WHERE referral_code = $1", [referralCode]);
    if (existingCode.rows.length === 0) {
      isUnique = true;
    }
  }
  return referralCode;
};

// Helper function to generate a unique 6-digit user ID
const generateUserId = async () => {
  let userId;
  let isUnique = false;

  while (!isUnique) {
    userId = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit user ID
    const existingUser = await pool.query("SELECT * FROM users WHERE user_id = $1", [userId]);
    if (existingUser.rows.length === 0) {
      isUnique = true;
    }
  }
  return userId;
};

// Sign-up endpoint
app.post("/signup", async (req, res) => {
  const { username, email, password, mobile_number, referral_code } = req.body;

  if (!username || !email || !password || !mobile_number || !referral_code) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const referrer = await pool.query("SELECT * FROM users WHERE referral_code = $1", [referral_code]);
    if (referrer.rows.length === 0) {
      return res.status(400).json({ message: "Invalid referral code" });
    }

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR mobile_number = $2",
      [normalizedEmail, mobile_number]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "Email or mobile number is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await generateUserId();
    const newReferralCode = await generateReferralCode();

    const newUser = await pool.query(
      "INSERT INTO users (username, email, password, user_id, mobile_number, referral_code, referred_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [username, normalizedEmail, hashedPassword, userId, mobile_number, newReferralCode, referral_code]
    );

    const token = generateToken(newUser.rows[0].id);
    res.json({ token, user: newUser.rows[0] });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user" });
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  const { mobile_number, password } = req.body;

  if (!mobile_number || !password) {
    return res.status(400).json({ message: "Mobile number and password are required" });
  }

  try {
    const user = await pool.query("SELECT * FROM users WHERE mobile_number = $1", [mobile_number.trim()]);

    if (!user || user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.rows[0].id);
    res.json({ token, user: user.rows[0] });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in" });
  }
});

// Endpoint to get list of investment packages
app.get("/packages", async (req, res) => {
  try {
    const packages = await pool.query("SELECT * FROM packages WHERE is_active = TRUE ORDER BY created_at DESC");
    res.json(packages.rows);
  } catch (error) {
    console.error("Failed to fetch packages:", error);
    res.status(500).json({ message: "Failed to fetch packages" });
  }
});

// Endpoint to purchase a package and update wallet balance
app.post("/buy-package", async (req, res) => {
  const { package_id, investment_amount } = req.body;
  const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      // Fetch user's current wallet balance
      const userRes = await pool.query("SELECT wallet FROM users WHERE id = $1", [userId]);
      const userWallet = parseFloat(userRes.rows[0].wallet); // Convert to float

      // Check if user has sufficient funds
      if (userWallet < parseFloat(investment_amount)) {
          return res.status(400).json({ message: "Insufficient wallet balance" });
      }

      // Deduct the investment amount from user's wallet
      await pool.query("UPDATE users SET wallet = wallet - $1 WHERE id = $2", [investment_amount, userId]);

      // Check if the package is active before recording the purchase
      const packageRes = await pool.query("SELECT is_active, earnings_per_day FROM packages WHERE package_id = $1", [package_id]);
      
      if (packageRes.rows.length === 0 || !packageRes.rows[0].is_active) {
          return res.status(400).json({ message: "Selected package is not active." });
      }

      // Record the purchase in the purchases table
      await pool.query(
          "INSERT INTO purchases (user_id, package_id, investment_amount, purchase_date, is_active) VALUES ($1, $2, $3, NOW(), TRUE)",
          [userId, package_id, investment_amount]
      );

      // Immediately update wallet based on active earnings from the purchased package
      const earningsPerDay = packageRes.rows[0].earnings_per_day; // Get the earnings from the package
      await pool.query("UPDATE users SET wallet = wallet + $1 WHERE id = $2", [earningsPerDay, userId]); // Update wallet

      res.json({ message: "Package purchased successfully" });
  } catch (error) {
      console.error("Failed to purchase package:", error);
      res.status(500).json({ message: "Failed to purchase package" });
  }
});

// Middleware to verify admin access
const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.id]);
    if (user.rows[0] && user.rows[0].isadmin) {
      next();
    } else {
      return res.status(403).json({ message: "Access denied" });
    }
  } catch (error) {
    console.error("Access verification error:", error);
    return res.status(403).json({ message: "Access denied" });
  }
};

// Admin route to fetch all users
app.get("/admin/users", verifyAdmin, async (req, res) => {
  try {
    const users = await pool.query(
      "SELECT id, username, email, isadmin, wallet, user_id, mobile_number, referral_code, referred_by FROM users"
    );
    res.json(users.rows);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Endpoint to update user wallet
// Endpoint to update user's wallet based on active packages
app.put("/update-wallets", verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE users u
      SET wallet = wallet + (
        SELECT SUM(pk.earnings_per_day)
        FROM purchases pu
        JOIN packages pk ON pu.package_id = pk.package_id
        WHERE pu.user_id = u.id AND pu.is_active = TRUE
      )
      WHERE EXISTS (
        SELECT 1 FROM purchases pu
        WHERE pu.user_id = u.id AND pu.is_active = TRUE
      )
    `);
    res.json({ message: "Wallets updated successfully." });
  } catch (error) {
    console.error('Error updating wallets:', error);
    res.status(500).json({ message: "Failed to update wallets." });
  }
});

// Admin route to update wallet balance for a user
app.put("/admin/update-wallet/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { wallet } = req.body;

  // Parse wallet as a float and validate it
  const walletAmount = parseFloat(wallet);
  if (isNaN(walletAmount) || walletAmount < 0) {
    return res.status(400).json({ message: "Invalid wallet amount." });
  }

  try {
    const updatedUser = await pool.query(
      "UPDATE users SET wallet = $1 WHERE id = $2 RETURNING id, username, email, wallet, isadmin",
      [walletAmount, id]
    );

    // Check if the user was found and updated
    if (updatedUser.rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error("Error updating wallet balance:", error);
    res.status(500).json({ message: "Failed to update wallet balance" });
  }
});

// Endpoint to fetch user data (MyAccount)
app.get("/get-user", async (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await pool.query("SELECT id, username, email, wallet, user_id, mobile_number, referral_code FROM users WHERE id = $1", [userId]);
    res.json(user.rows[0]); // Ensure wallet is included in the response
  } catch (error) {
    console.error("Failed to fetch user:", error);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
});

// Endpoint to get active packages for the user (for My Account page)
app.get("/user/active-packages", async (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const activePackages = await pool.query(`
      SELECT pk.package_id, pk.name, pk.description, pk.investment_amount, pk.earnings_per_day, pk.total_earnings, pk.earnings_days, pk.maximum_purchase
      FROM purchases pu
      JOIN packages pk ON pu.package_id = pk.package_id
      WHERE pu.user_id = $1 AND pu.is_active = TRUE`, [userId]);

    res.json(activePackages.rows);
  } catch (error) {
    console.error("Failed to fetch active packages:", error);
    res.status(500).json({ message: "Failed to fetch active packages" });
  }
});

// Endpoint to create a new package
app.post("/admin/add-package", verifyAdmin, async (req, res) => {
  const { name, description, investment_amount, earnings_per_day, earnings_days, total_earnings, maximum_purchase, is_active } = req.body;

  if (!name || !investment_amount || !earnings_per_day || !earnings_days || !total_earnings) {
    return res.status(400).json({ message: "Required fields are missing." });
  }

  try {
    const newPackage = await pool.query(
      `INSERT INTO packages (name, description, investment_amount, earnings_per_day, earnings_days, total_earnings, maximum_purchase, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, description, investment_amount, earnings_per_day, earnings_days, total_earnings, maximum_purchase, is_active]
    );

    res.status(201).json(newPackage.rows[0]);
  } catch (error) {
    console.error("Error creating package:", error);
    res.status(500).json({ message: "Failed to create package" });
  }
});

// Endpoint to get all packages
app.get("/admin/packages", verifyAdmin, async (req, res) => {
  try {
    const packages = await pool.query("SELECT * FROM packages ORDER BY created_at DESC");
    res.json(packages.rows);
  } catch (error) {
    console.error("Failed to fetch packages:", error);
    res.status(500).json({ message: "Failed to fetch packages" });
  }
});

// Endpoint to get all purchases
app.get("/admin/purchases", verifyAdmin, async (req, res) => {
  try {
    const purchases = await pool.query(
      "SELECT * FROM purchases ORDER BY purchase_date DESC"
    );
    res.json(purchases.rows);
  } catch (error) {
    console.error("Failed to fetch purchases:", error);
    res.status(500).json({ message: "Failed to fetch purchases" });
  }
});

// Endpoint to get package sales data
app.get("/admin/package-sales", verifyAdmin, async (req, res) => {
  try {
    const salesData = await pool.query(`
      SELECT p.package_id, pk.name, SUM(p.investment_amount) AS total_investment, COUNT(p.user_id) AS total_sales
      FROM purchases p
      JOIN packages pk ON p.package_id = pk.package_id
      GROUP BY p.package_id, pk.name
      ORDER BY total_sales DESC
    `);
    res.json(salesData.rows);
  } catch (error) {
    console.error("Failed to fetch package sales:", error);
    res.status(500).json({ message: "Failed to fetch package sales" });
  }
});

// Endpoint to get active packages for the authenticated user
app.get("/get-active-packages", async (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const activePackages = await pool.query(`
      SELECT pk.package_id, pu.purchase_date ,pk.name, pk.description, pk.investment_amount, pk.earnings_per_day, pk.total_earnings, pk.earnings_days
      FROM purchases pu
      JOIN packages pk ON pu.package_id = pk.package_id
      WHERE pu.user_id = $1 AND pu.is_active = TRUE
    `, [userId]);

    res.json(activePackages.rows);
  } catch (error) {
    console.error("Failed to fetch active packages:", error);
    res.status(500).json({ message: "Failed to fetch active packages" });
  }
});

// Start the server
const PORT = process.env.PORT || 5004;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
