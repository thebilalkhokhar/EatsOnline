const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");
require("dotenv").config();

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post("/signup", async (req, res) => {
  const { name, email, password, phone, addresses } = req.body;

  try {
    // Input validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        message: "All fields (name, email, password, phone) are required",
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Phone number validation
    let normalizedPhone = phone.trim();
    const localPhoneRegex = /^03[0-4][0-9]{8}$/;
    const internationalPhoneRegex = /^\+923[0-4][0-9]{8}$/;
    if (localPhoneRegex.test(normalizedPhone)) {
      normalizedPhone = "+92" + normalizedPhone.slice(1);
    } else if (!internationalPhoneRegex.test(normalizedPhone)) {
      return res.status(400).json({
        message:
          "Please enter a valid Pakistani phone number (e.g., 03134432915)",
      });
    }

    // Check if user exists (email or phone)
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone: normalizedPhone }],
    });
    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email.toLowerCase()
            ? "Email already exists"
            : "Phone number already exists",
      });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password, // Let pre-save hook handle hashing
      phone: normalizedPhone,
      addresses: Array.isArray(addresses)
        ? addresses.filter((addr) => addr.trim().length > 0)
        : [],
      role: "customer", // Default role
    });

    await user.save();
    console.log("User created:", { email: user.email, phone: user.phone });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password mismatch for email:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/auth/logout
router.post("/logout", authMiddleware, (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// @route   GET /api/auth/profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      addresses: user.addresses,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      restaurantId: user.restaurantId,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/auth/profile
router.put("/profile", authMiddleware, async (req, res) => {
  const { name, phone, address } = req.body;

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) {
      if (name.length < 2) {
        return res
          .status(400)
          .json({ message: "Name must be at least 2 characters" });
      }
      user.name = name;
    }
    if (phone) {
      let normalizedPhone = phone.trim();
      const localPhoneRegex = /^03[0-4][0-9]{8}$/;
      const internationalPhoneRegex = /^\+923[0-4][0-9]{8}$/;
      if (localPhoneRegex.test(normalizedPhone)) {
        normalizedPhone = "+92" + normalizedPhone.slice(1);
      } else if (!internationalPhoneRegex.test(normalizedPhone)) {
        return res.status(400).json({
          message:
            "Please enter a valid Pakistani phone number (e.g., 03134432915)",
        });
      }
      if (
        normalizedPhone !== user.phone &&
        (await User.findOne({ phone: normalizedPhone }))
      ) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
      user.phone = normalizedPhone;
    }
    if (address) {
      if (typeof address !== "string" || address.trim().length === 0) {
        return res
          .status(400)
          .json({ message: "Address must be a non-empty string" });
      }
      user.addresses.unshift(address.trim());
      user.addresses = user.addresses.slice(0, 5);
    }

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      addresses: user.addresses,
      role: user.role,
      updatedAt: user.updatedAt,
      restaurantId: user.restaurantId
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/auth/role
router.put("/role", authMiddleware, async (req, res) => {
  const { role } = req.body;
  try {
    if (!["customer", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { role },
      { new: true, select: "-password" }
    );
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
