require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");

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

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Sign-up endpoint
const generateUserId = async () => {
    let userId;
    let isUnique = false;
  
    // Generate a unique 6-digit ID
    while (!isUnique) {
      userId = Math.floor(100000 + Math.random() * 900000).toString();
      const existingUser = await pool.query("SELECT * FROM users WHERE user_id = $1", [userId]);
      if (existingUser.rows.length === 0) {
        isUnique = true; // Exit loop if user_id is unique
      }
    }
    return userId;
  };
  
  // Sign-up endpoint
  app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;
  
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
  
    try {
      // Check if email is already registered
      const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ message: "Email is already registered" });
      }
  
      // Hash the password and generate a unique 6-digit user_id
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = await generateUserId();
  
      // Insert new user into the database
      const newUser = await pool.query(
        "INSERT INTO users (username, email, password, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
        [username, email, hashedPassword, userId]
      );
  
      const token = generateToken(newUser.rows[0].id);
  
      // Log successful user creation
      console.log("New user created:", newUser.rows[0]);
      res.json({ token, user: newUser.rows[0] }); // Return the token and user details
    } catch (error) {
      console.error("Error creating user:", error); // Log any errors
      res.status(500).json({ message: "Error creating user" });
    }
  });

// Login endpoint
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (!user.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user.rows[0].id);
    res.json({ token, user: user.rows[0] });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in" });
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
      const users = await pool.query("SELECT id, username, email, isadmin, wallet FROM users");
      res.json(users.rows); // Ensure each user includes wallet data
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

// Endpoint to update user information (e.g., username)
app.put("/update-user", async (req, res) => {
    const { username } = req.body;
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
  
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  
    if (!username || typeof username !== "string") {
      return res.status(400).json({ message: "Invalid username" });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
  
      // Update the username and return user data including user_id
      const updatedUser = await pool.query(
        "UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, email, wallet",
        [username, userId]
      );
  
      if (updatedUser.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
  
      console.log("Updated user data:", updatedUser.rows[0]); // Log the updated user data
  
      res.json(updatedUser.rows[0]);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user information" });
    }
  });
  

// Endpoint to update wallet balance (admin only)
app.put("/admin/update-wallet/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { wallet } = req.body;

  try {
    const updatedUser = await pool.query(
      "UPDATE users SET wallet = $1 WHERE id = $2 RETURNING id, username, email, wallet, isadmin",
      [wallet, id]
    );
    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error("Error updating wallet balance:", error);
    res.status(500).json({ message: "Failed to update wallet balance" });
  }
});

// Endpoint to fetch current user data (MyAccount)
app.get("/get-user", async (req, res) => {
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
  
      const user = await pool.query("SELECT id, username, email, wallet, user_id FROM users WHERE id = $1", [userId]);
      res.json(user.rows[0]); // Ensure wallet is included in the response
    } catch (error) {
      console.error("Failed to fetch user:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });
  

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
