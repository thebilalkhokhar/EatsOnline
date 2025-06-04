const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { authMiddleware } = require("../middleware/auth");

router.post("/", authMiddleware, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    console.log("Add to cart request:", req.body);
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }
    const qty = quantity && quantity > 0 ? Math.floor(quantity) : 1;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.stock < qty) {
      return res
        .status(400)
        .json({ message: `${product.name} is out of stock` });
    }

    let cart = await Cart.findOne({ user: req.user.userId });
    if (!cart) {
      cart = new Cart({
        user: req.user.userId,
        items: [{ product: productId, quantity: qty }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity = qty; // Overwrite, don't add
      } else {
        cart.items.push({ product: productId, quantity: qty });
      }
    }

    await cart.save();
    await cart.populate("items.product", "name price image stock restaurantId");
    res.status(201).json({
      message: "Product added to cart",
      cart: {
        items: cart.items,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    console.log("Fetching cart for user:", req.user.userId);
    const cart = await Cart.findOne({ user: req.user.userId }).populate(
      "items.product",
      "name price image stock restaurantId"
    );
    if (!cart) {
      return res
        .status(200)
        .json({ message: "Cart is empty", cart: { items: [] } });
    }
    // Filter out items with invalid product references or missing restaurantId
    cart.items = cart.items.filter(
      (item) => item.product !== null && item.product.restaurantId
    );
    await cart.save();
    res.json({
      cart: {
        items: cart.items,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put("/", authMiddleware, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    console.log("Update cart request:", req.body);
    if (!productId || quantity === undefined) {
      return res
        .status(400)
        .json({ message: "Product ID and quantity are required" });
    }
    const qty = Math.floor(quantity);
    if (qty < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ user: req.user.userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.stock < qty) {
      return res
        .status(400)
        .json({ message: `${product.name} has insufficient stock` });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cart.items[itemIndex].quantity = qty; // Overwrite quantity
    await cart.save();
    await cart.populate("items.product", "name price image stock restaurantId");
    res.json({
      message: "Cart updated successfully",
      cart: {
        items: cart.items,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete("/:productId", authMiddleware, async (req, res) => {
  try {
    console.log("Remove item request:", req.params.productId);
    const cart = await Cart.findOne({ user: req.user.userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === req.params.productId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();
    await cart.populate("items.product", "name price image stock restaurantId");
    res.json({
      message: "Product removed from cart",
      cart: {
        items: cart.items,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete("/", authMiddleware, async (req, res) => {
  try {
    console.log("Clear cart request for user:", req.user.userId);
    const cart = await Cart.findOne({ user: req.user.userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();
    res.json({ message: "Cart cleared successfully", cart: { items: [] } });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
