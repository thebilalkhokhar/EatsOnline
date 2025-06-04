const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const Review = require("../models/Review");
const mongoose = require("mongoose");

// @route   POST /api/orders
router.post("/", authMiddleware, async (req, res) => {
  const { deliveryAddress, paymentMethod, restaurantId, stripeSessionId } = req.body;

  try {
    if (!deliveryAddress) {
      return res.status(400).json({ message: "Delivery address is required" });
    }
    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant is required" });
    }

    const cart = await Cart.findOne({ user: req.user.userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    if (!restaurant.deliveryAvailable) {
      return res
        .status(400)
        .json({ message: "Delivery is not available for this restaurant" });
    }

    const itemsRestaurantIds = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Product ${item.product} not found`);
        }
        return product.restaurantId.toString();
      })
    );
    if (itemsRestaurantIds.some((id) => id !== restaurantId)) {
      return res
        .status(400)
        .json({ message: "All items must belong to the same restaurant" });
    }

    let totalPrice = 0;
    const orderItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Product ${item.product} not found`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`${product.name} is out of stock`);
        }
        totalPrice += product.price * item.quantity;
        product.stock -= item.quantity;
        await product.save();

        return {
          product: item.product,
          quantity: item.quantity,
          price: product.price,
        };
      })
    );

    if (totalPrice < restaurant.minimumOrderAmount) {
      return res.status(400).json({
        message: `Minimum order amount is ${restaurant.minimumOrderAmount}`,
      });
    }

    const order = new Order({
      user: req.user.userId,
      items: orderItems,
      totalPrice,
      deliveryAddress,
      paymentMethod,
      restaurantId,
      status: "Pending",
      stripeSessionId
    });

    await order.save();
    cart.items = [];
    await cart.save();

    res.status(201).json({
      message: "Order placed successfully",
      orderId: order._id,
      totalPrice,
      status: order.status,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/orders
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const { createdBy } = req.query;

    let query;
    if (role === "admin") {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Admins can fetch orders they placed as customers OR orders for their restaurant
      query = {
        $or: [
          { user: userId }, // Orders placed by the admin as a customer
          { restaurantId: user.restaurantId }, // Orders for their restaurant
        ],
      };
    } else {
      query = { user: createdBy || userId }; // Customers fetch their own orders
    }

    console.log("Fetching orders with query:", query); // Debug log
    const orders = await Order.find(query)
      .populate("items.product", "name price image")
      .populate("restaurantId", "name")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/orders/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    console.log("Fetching order details for ID:", req.params.id);
    console.log("User context:", { 
      userId: req.user.userId, 
      role: req.user.role 
    });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("Invalid ObjectId format:", req.params.id);
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    // First try to find the order without population to check if it exists
    const orderExists = await Order.findById(req.params.id);
    if (!orderExists) {
      console.log("Order not found in database:", req.params.id);
      return res.status(404).json({ message: "Order not found" });
    }

    // If order exists, try to populate all fields
    try {
      const order = await Order.findById(req.params.id)
        .populate({
          path: "items.product",
          select: "name price image",
          model: "Product"
        })
        .populate({
          path: "restaurantId",
          select: "name",
          model: "Restaurant"
        })
        .populate({
          path: "user",
          select: "name _id",
          model: "User"
        });

      // Log the raw order data for debugging
      console.log("Raw order data:", JSON.stringify({
        id: order._id,
        userId: order.user?._id,
        restaurantId: order.restaurantId?._id,
        items: order.items?.length,
        status: order.status
      }, null, 2));

      // Get the current user
      const currentUser = await User.findById(req.user.userId);
      if (!currentUser) {
        console.log("Current user not found:", req.user.userId);
        return res.status(404).json({ message: "User not found" });
      }

      // Authorization check with detailed logging
      const isOwnOrder = order.user?._id.toString() === currentUser._id.toString();
      const isRestaurantAdmin = currentUser.role === "admin" && 
                              currentUser.restaurantId && 
                              order.restaurantId?._id.toString() === currentUser.restaurantId.toString();

      console.log("Authorization details:", {
        isOwnOrder,
        isRestaurantAdmin,
        userMatch: {
          orderUserId: order.user?._id.toString(),
          currentUserId: currentUser._id.toString(),
          matches: order.user?._id.toString() === currentUser._id.toString()
        },
        restaurantMatch: {
          orderRestaurantId: order.restaurantId?._id.toString(),
          userRestaurantId: currentUser.restaurantId?.toString(),
          matches: order.restaurantId?._id.toString() === currentUser.restaurantId?.toString()
        }
      });

      if (!isOwnOrder && !isRestaurantAdmin) {
        return res.status(403).json({ 
          message: "Not authorized to view this order",
          details: {
            isOwnOrder,
            isRestaurantAdmin,
            userRole: currentUser.role
          }
        });
      }

      res.json(order);
    } catch (populateError) {
      console.error("Error during population:", {
        error: populateError.message,
        stack: populateError.stack
      });
      return res.status(500).json({ 
        message: "Error loading order details",
        details: populateError.message
      });
    }
  } catch (error) {
    console.error("Order details error:", {
      error: error.message,
      stack: error.stack,
      orderId: req.params.id,
      userId: req.user?.userId
    });
    
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid order ID format" });
    }
    res.status(500).json({ 
      message: "Server error", 
      details: error.message 
    });
  }
});

// @route   PUT /api/orders/:id
router.put("/:id", adminMiddleware, async (req, res) => {
  const { status } = req.body;

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const user = await User.findById(req.user.userId);
    if (order.restaurantId.toString() !== user.restaurantId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this order" });
    }

    if (
      ![
        "Pending",
        "Confirmed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    order.status = status;
    await order.save();
    console.log(`Order ${order._id} status updated to ${status}`); // Debug log

    // Populate the order before sending response
    const updatedOrder = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.product", "name price image");

    res.json({
      message: "Order status updated",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid order ID" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/admin/orders
router.get("/admin/orders", adminMiddleware, async (req, res) => {
  const { status } = req.query;

  try {
    let query = {};
    const user = await User.findById(req.user.userId);
    query.restaurantId = user.restaurantId;
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate("user", "name email phone")
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get orders eligible for review
router.get("/eligible-for-review/:restaurantId", authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Find delivered orders that haven't been reviewed yet
    const orders = await Order.find({
      user: req.user.userId,
      restaurantId,
      status: "Delivered"
    }).sort({ createdAt: -1 });

    // Filter out orders that already have reviews
    const eligibleOrders = [];
    for (const order of orders) {
      const review = await Review.findOne({ order: order._id });
      if (!review) {
        eligibleOrders.push(order);
      }
    }

    res.json({ orders: eligibleOrders });
  } catch (error) {
    console.error("Error fetching eligible orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
