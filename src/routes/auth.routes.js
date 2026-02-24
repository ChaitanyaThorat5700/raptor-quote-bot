import express from "express";
import { createUser, loginUser } from "../services/auth.service.js";

const router = express.Router();

// Register (for now open — later restrict to admin)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "name, email and password required"
      });
    }

    const user = await createUser({ name, email, password, role });

    return res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create user"
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "email and password required"
      });
    }

    const result = await loginUser({ email, password });

    return res.json({
      success: true,
      ...result
    });

  } catch (error) {
    if (error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      error: "Login failed"
    });
  }
});

export default router;