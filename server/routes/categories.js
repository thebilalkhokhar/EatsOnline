const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const User = require("../models/User"); // Added to fetch user
const { adminMiddleware } = require("../middleware/auth");

// @route   POST /api/categories
// @desc    Add a new category (Admin Only)
// @access  Private (Admin)
router.post("/", adminMiddleware, async (req, res) => {
  const { name, description } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const user = await User.findById(req.user.userId);
    if (!user || !user.restaurantId) {
      return res.status(400).json({ message: "Invalid user or restaurant" });
    }

    const existingCategory = await Category.findOne({
      name,
      restaurantId: user.restaurantId,
    });
    if (existingCategory) {
      return res
        .status(400)
        .json({ message: "Category already exists for this restaurant" });
    }

    const category = new Category({
      name,
      description,
      restaurantId: user.restaurantId,
    });

    await category.save();
    res.status(201).json({
      message: "Category added successfully",
      category: {
        id: category._id,
        name: category.name,
        description: category.description,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res
        .status(400)
        .json({ message: "Category name already exists for this restaurant" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/categories
// @desc    Get categories for the admin's restaurant (Admin Only)
// @access  Private (Admin)
router.get("/", adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.restaurantId) {
      return res.status(400).json({ message: "Invalid user or restaurant" });
    }
    const categories = await Category.find({
      restaurantId: user.restaurantId,
    }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category (Admin Only)
// @access  Private (Admin)
router.put("/:id", adminMiddleware, async (req, res) => {
  const { name, description } = req.body;

  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    const user = await User.findById(req.user.userId);
    if (category.restaurantId.toString() !== user.restaurantId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this category" });
    }

    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        name,
        restaurantId: user.restaurantId,
      });
      if (existingCategory) {
        return res
          .status(400)
          .json({
            message: "Category name already exists for this restaurant",
          });
      }
    }

    category.name = name || category.name;
    category.description = description || category.description;

    await category.save();
    res.json({
      message: "Category updated successfully",
      category: {
        id: category._id,
        name: category.name,
        description: category.description,
      },
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Category name already exists for this restaurant" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category (Admin Only)
// @access  Private (Admin)
router.delete("/:id", adminMiddleware, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    const user = await User.findById(req.user.userId);
    if (category.restaurantId.toString() !== user.restaurantId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this category" });
    }

    await category.deleteOne();
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
