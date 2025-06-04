const express = require("express");
const router = express.Router();
const mongoose = require("mongoose"); // Moved to top
const Product = require("../models/Product");
const User = require("../models/User");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");
const fs = require('fs').promises;

router.post("/", adminMiddleware, upload.single('image'), async (req, res) => {
  const { name, category, price, stock, description } = req.body;

  try {
    console.log("Request body:", req.body);

    if (!name || !category || !price || stock === undefined) {
      return res.status(400).json({
        message: "Missing required fields: name, category, price, stock",
      });
    }

    const user = await User.findById(req.user.userId);
    const existingProduct = await Product.findOne({
      name,
      category,
      restaurantId: user.restaurantId,
    });
    if (existingProduct) {
      return res
        .status(400)
        .json({ message: "Product already exists in this category" });
    }

    let imageData = {
      public_id: "default-product",
      url: "default-image.jpg"
    };

    if (req.file) {
      const cloudinaryResponse = await uploadToCloudinary(req.file.path, 'products');
      imageData = cloudinaryResponse;
      // Delete the temporary file
      await fs.unlink(req.file.path);
    }

    const product = new Product({
      name,
      category,
      price,
      image: imageData,
      stock,
      description,
      createdBy: req.user.userId,
      restaurantId: user.restaurantId,
    });

    await product.save();
    const populatedProduct = await Product.findById(product._id).populate(
      "category",
      "name"
    );
    res.status(201).json({
      message: "Product added successfully",
      product: populatedProduct,
    });
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    console.error("Error adding product:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: Object.values(error.errors).map((e) => e.message),
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/", async (req, res) => {
  const { category, price_min, price_max, restaurantId } = req.query;
  try {
    let query = {};
    if (restaurantId) {
      if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      query.restaurantId = restaurantId;
    }
    if (category) query.category = category;
    if (price_min) query.price = { $gte: Number(price_min) };
    if (price_max) query.price = { ...query.price, $lte: Number(price_max) };
    const products = await Product.find(query)
      .populate("category", "name")
      .select("name category price image stock description restaurantId");
    // Filter out products with invalid category references
    const filteredProducts = products.filter((product) => {
      if (!product.category) {
        console.warn(`Product ${product._id} has invalid category reference`);
        return false;
      }
      return true;
    });
    res.json(filteredProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name")
      .select("-createdBy");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (!product.category) {
      console.warn(`Product ${product._id} has invalid category reference`);
      return res.status(400).json({ message: "Product has invalid category" });
    }
    const user = await User.findById(req.user.userId);
    if (
      req.user.role === "admin" &&
      product.restaurantId.toString() !== user.restaurantId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this product" });
    }
    res.json(product);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put("/:id", adminMiddleware, upload.single('image'), async (req, res) => {
  const { name, category, price, stock, description } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const user = await User.findById(req.user.userId);
    if (product.restaurantId.toString() !== user.restaurantId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this product" });
    }

    let imageData = product.image;

    if (req.file) {
      // Delete old image from Cloudinary if it exists and is not the default
      if (product.image.public_id && product.image.public_id !== "default-product") {
        await deleteFromCloudinary(product.image.public_id);
      }
      
      // Upload new image
      const cloudinaryResponse = await uploadToCloudinary(req.file.path, 'products');
      imageData = cloudinaryResponse;
      
      // Delete the temporary file
      await fs.unlink(req.file.path);
    }

    product.name = name || product.name;
    product.category = category || product.category;
    product.price = price !== undefined ? price : product.price;
    product.image = imageData;
    product.stock = stock !== undefined ? stock : product.stock;
    product.description = description || product.description;
    
    await product.save();
    const populatedProduct = await Product.findById(product._id).populate(
      "category",
      "name"
    );
    if (!populatedProduct.category) {
      return res.status(400).json({ message: "Product has invalid category" });
    }
    res.json({
      message: "Product updated successfully",
      product: populatedProduct,
    });
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete("/:id", adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const user = await User.findById(req.user.userId);
    if (product.restaurantId.toString() !== user.restaurantId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this product" });
    }

    // Delete image from Cloudinary if it exists and is not the default
    if (product.image.public_id && product.image.public_id !== "default-product") {
      await deleteFromCloudinary(product.image.public_id);
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
