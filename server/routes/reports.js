const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const User = require("../models/User"); // Added User model import
const { adminMiddleware } = require("../middleware/auth");

// @route   GET /api/admin/reports/sales
// @desc    Get sales report for the admin's restaurant (Admin Only)
// @access  Private (Admin)
router.get("/sales", adminMiddleware, async (req, res) => {
  const { period = "daily", startDate, endDate } = req.query;

  try {
    console.log("Sales report request:", {
      userId: req.user.userId,
      query: req.query,
    }); // Debug log

    const user = await User.findById(req.user.userId);
    if (!user) {
      console.error("User not found for userId:", req.user.userId);
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.restaurantId) {
      console.error("No restaurantId found for user:", req.user.userId);
      return res
        .status(400)
        .json({ message: "No restaurant associated with this admin" });
    }

    console.log("Fetching sales for restaurantId:", user.restaurantId); // Debug log

    // Date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (period === "daily") {
      dateFilter.createdAt = { $gte: new Date().setHours(0, 0, 0, 0) };
    } else if (period === "weekly") {
      dateFilter.createdAt = {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      };
    } else if (period === "monthly") {
      dateFilter.createdAt = {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };
    }

    // Add restaurantId filter
    const query = {
      ...dateFilter,
      restaurantId: user.restaurantId,
    };

    console.log("Sales report query:", query); // Debug log
    const orders = await Order.find(query).populate({
      path: "items.product",
      select: "name",
    });
    console.log("Orders fetched:", orders.length); // Debug log

    // Handle empty orders
    if (!orders || orders.length === 0) {
      return res.json({
        success: true,
        data: {
          totalSales: 0,
          totalOrders: 0,
          avgOrderValue: 0,
          salesByPeriod: [],
          topProducts: [],
        },
        message: "No orders found",
      });
    }

    // Calculate totals
    const totalSales = orders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0
    );
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Sales by period
    const salesByPeriod = [];
    if (period === "daily") {
      const dailySales = orders.reduce((acc, order) => {
        const date = new Date(order.createdAt).toLocaleDateString("en-US");
        acc[date] = acc[date] || { sales: 0, orders: 0 };
        acc[date].sales += order.totalPrice || 0;
        acc[date].orders += 1;
        return acc;
      }, {});
      for (const [date, data] of Object.entries(dailySales)) {
        salesByPeriod.push({
          period: date,
          sales: data.sales,
          orders: data.orders,
        });
      }
    } else if (period === "weekly") {
      const weeklySales = orders.reduce((acc, order) => {
        const week = `${new Date(order.createdAt).getFullYear()}-W${Math.ceil(
          (new Date(order.createdAt).getDate() +
            new Date(order.createdAt).getDay() +
            1) /
            7
        )}`;
        acc[week] = acc[week] || { sales: 0, orders: 0 };
        acc[week].sales += order.totalPrice || 0;
        acc[week].orders += 1;
        return acc;
      }, {});
      for (const [week, data] of Object.entries(weeklySales)) {
        salesByPeriod.push({
          period: week,
          sales: data.sales,
          orders: data.orders,
        });
      }
    } else if (period === "monthly") {
      const monthlySales = orders.reduce((acc, order) => {
        const month = new Date(order.createdAt).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
        });
        acc[month] = acc[month] || { sales: 0, orders: 0 };
        acc[month].sales += order.totalPrice || 0;
        acc[month].orders += 1;
        return acc;
      }, {});
      for (const [month, data] of Object.entries(monthlySales)) {
        salesByPeriod.push({
          period: month,
          sales: data.sales,
          orders: data.orders,
        });
      }
    }

    // Top products
    const productSales = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.product) {
          const productId = item.product._id.toString();
          productSales[productId] = productSales[productId] || {
            name: item.product.name || "Unknown Product",
            totalSales: 0,
            unitsSold: 0,
          };
          productSales[productId].totalSales += item.price * item.quantity;
          productSales[productId].unitsSold += item.quantity;
        }
      });
    });
    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({
        _id: id,
        name: data.name,
        totalSales: data.totalSales,
        unitsSold: data.unitsSold,
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        totalSales,
        totalOrders,
        avgOrderValue,
        salesByPeriod,
        topProducts,
      },
    });
  } catch (error) {
    console.error("Sales report error:", error.message, error.stack);
    res
      .status(500)
      .json({ message: "Failed to load sales report", error: error.message });
  }
});

module.exports = router;
