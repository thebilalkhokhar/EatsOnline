const express = require("express");
const router = express.Router();
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");
const fs = require('fs').promises;

// @route   GET /api/restaurants
// @desc    Get all active restaurants (public access)
router.get("/", async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isActive: true }).select(
      "name address contact cuisineType deliveryAvailable logo description minimumOrderAmount averageDeliveryTime"
    );
    res.json(restaurants);
  } catch (error) {
    console.error("Fetch restaurants error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/restaurants
router.post("/", authMiddleware, upload.single('logo'), async (req, res) => {
  const { name, address, contact, cuisineType, deliveryAvailable } = req.body;
  console.log("Received restaurant data:", req.body); // Debugging
  try {
    if (
      !name ||
      !address?.city ||
      !address?.country ||
      !contact?.phone ||
      !cuisineType
    ) {
      return res
        .status(400)
        .json({ message: "All required fields are missing" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.restaurantId) {
      return res
        .status(400)
        .json({ message: "Admin already has a restaurant" });
    }

    let logoData = {
      public_id: "default-restaurant",
      url: "default-logo.jpg"
    };

    if (req.file) {
      const cloudinaryResponse = await uploadToCloudinary(req.file.path, 'restaurants');
      logoData = cloudinaryResponse;
      // Delete the temporary file
      await fs.unlink(req.file.path);
    }

    // Parse cuisineType if it's a string
    let parsedCuisineType = cuisineType;
    if (typeof cuisineType === 'string') {
      try {
        parsedCuisineType = JSON.parse(cuisineType);
      } catch (e) {
        parsedCuisineType = cuisineType.split(',').map(c => c.trim());
      }
    }

    const restaurantData = {
      name,
      address: {
        street: address.street || "",
        city: address.city,
        country: address.country,
        postalCode: address.postalCode || "",
      },
      contact: {
        phone: contact.phone,
        email: contact.email || "",
      },
      cuisineType: parsedCuisineType,
      deliveryAvailable: deliveryAvailable === 'true' || deliveryAvailable === true,
      adminId: req.user.userId,
      logo: logoData
    };

    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();
    console.log("Restaurant saved:", restaurant); // Debugging

    user.restaurantId = restaurant._id;
    await user.save();
    console.log("User updated with restaurantId:", user); // Debugging

    res.status(201).json(restaurant);
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    console.error("Restaurant creation error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/restaurants/:id
router.put("/:id", authMiddleware, upload.single('logo'), async (req, res) => {
  const { name, address, contact, cuisineType, deliveryAvailable } = req.body;
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.restaurantId || user.restaurantId.toString() !== req.params.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this restaurant" });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    let logoData = restaurant.logo;

    if (req.file) {
      // Delete old logo from Cloudinary if it exists and is not the default
      if (restaurant.logo.public_id && restaurant.logo.public_id !== "default-restaurant") {
        await deleteFromCloudinary(restaurant.logo.public_id);
      }
      
      // Upload new logo
      const cloudinaryResponse = await uploadToCloudinary(req.file.path, 'restaurants');
      logoData = cloudinaryResponse;
      
      // Delete the temporary file
      await fs.unlink(req.file.path);
    }

    // Parse cuisineType if it's a string
    let parsedCuisineType = cuisineType;
    if (typeof cuisineType === 'string') {
      try {
        parsedCuisineType = JSON.parse(cuisineType);
      } catch (e) {
        parsedCuisineType = cuisineType.split(',').map(c => c.trim());
      }
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      {
        name,
        address: {
          street: address.street || "",
          city: address.city,
          country: address.country,
          postalCode: address.postalCode || "",
        },
        contact: {
          phone: contact.phone,
          email: contact.email || "",
        },
        cuisineType: parsedCuisineType,
        deliveryAvailable: deliveryAvailable === 'true' || deliveryAvailable === true,
        logo: logoData
      },
      { new: true, runValidators: true }
    );

    res.json(updatedRestaurant);
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    console.error("Restaurant update error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/restaurants/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.restaurantId || user.restaurantId.toString() !== req.params.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this restaurant" });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json(restaurant);
  } catch (error) {
    console.error("Restaurant fetch error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
