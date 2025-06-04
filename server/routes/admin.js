const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const { authMiddleware } = require("../middleware/auth");

// Middleware to check if user is admin
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

// Middleware to check if admin has a restaurant
const restaurantMiddleware = async (req, res, next) => {
  const user = await User.findById(req.user.userId);
  if (!user.restaurantId) {
    return res
      .status(403)
      .json({ message: "Admin access with restaurant required" });
  }
  req.user = user; // Update req.user with the fetched user
  next();
};

router.use(authMiddleware, adminMiddleware);

// @route   GET /api/admin/orders
router.get("/orders", restaurantMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.user.restaurantId })
      .populate("user", "name email")
      .populate("items.product", "name price")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/admin/reports/sales
router.get("/reports/sales", restaurantMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.user.restaurantId });
    const totalOrders = orders.length;
    const totalSales = orders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0
    );
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    const data = {
      totalOrders,
      totalSales,
      restaurantName: restaurant.name,
      address: restaurant.address,
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/admin/dashboard
router.get("/dashboard", restaurantMiddleware, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({
      restaurantId: req.user.restaurantId,
    });
    const totalOrders = await Order.countDocuments({
      restaurantId: req.user.restaurantId,
    });
    const totalCategories = await Category.countDocuments();
    const restaurant = await Restaurant.findById(req.user.restaurantId).select(
      "name address contact"
    );
    res.json({
      totalProducts,
      totalOrders,
      totalCategories,
      restaurantInfo: restaurant,
      message: "Welcome to Admin Dashboard",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/admin/products
router.get("/products", restaurantMiddleware, async (req, res) => {
  try {
    const products = await Product.find({
      restaurantId: req.user.restaurantId,
    }).populate("category", "name");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/admin/products
router.post("/products", restaurantMiddleware, async (req, res) => {
  const { name, description, price, category, stock, imageUrl } = req.body;
  try {
    const product = new Product({
      name,
      description,
      price,
      category,
      stock,
      image: imageUrl || "default-image.jpg",
      createdBy: req.user.userId,
      restaurantId: req.user.restaurantId,
    });
    await product.save();
    const populatedProduct = await Product.findById(product._id).populate(
      "category",
      "name"
    );
    res.status(201).json(populatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/admin/orders/:orderId
router.get("/orders/:orderId", restaurantMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      restaurantId: req.user.restaurantId,
    })
      .populate("user", "name email")
      .populate("items.product", "name price");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/admin/categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/admin/categories
router.post("/categories", async (req, res) => {
  const { name, description } = req.body;
  try {
    const category = new Category({ name, description });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
