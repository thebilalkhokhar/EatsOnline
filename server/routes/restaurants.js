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
    const restaurants = await Restaurant.find({ isActive: true })
      .select("name address contact cuisineType deliveryAvailable logo description rating")
      .lean();

    // Get latest rating stats for each restaurant
    const Review = require("../models/Review");
    const restaurantsWithRatings = await Promise.all(
      restaurants.map(async (restaurant) => {
        // Get rating statistics
        const stats = await Review.aggregate([
          {
            $match: {
              restaurant: restaurant._id,
              status: "approved"
            }
          },
          {
            $group: {
              _id: null,
              averageRating: { $avg: "$rating" },
              totalReviews: { $sum: 1 },
              ratingDistribution: {
                $push: "$rating"
              }
            }
          }
        ]);

        // Process rating distribution
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        if (stats.length > 0) {
          stats[0].ratingDistribution.forEach(rating => {
            distribution[rating] = (distribution[rating] || 0) + 1;
          });
        }

        const rating = stats.length > 0 ? {
          average: stats[0].averageRating,
          total: stats[0].totalReviews,
          distribution
        } : {
          average: 0,
          total: 0,
          distribution
        };

        // Update restaurant rating in database
        await Restaurant.findByIdAndUpdate(restaurant._id, { rating });

        return {
          ...restaurant,
          rating
        };
      })
    );

    res.json(restaurantsWithRatings);
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

    let logoData = null;

    if (req.file) {
      try {
        const cloudinaryResponse = await uploadToCloudinary(req.file.buffer, 'restaurants');
        logoData = cloudinaryResponse;
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ message: "Error uploading image" });
      }
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
  const { 
    name, 
    description,
    address, 
    contact, 
    cuisineType, 
    deliveryAvailable,
    minimumOrderAmount,
    averageDeliveryTime,
    operatingHours
  } = req.body;
  
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
      try {
        // Delete old logo from Cloudinary if it exists
        if (restaurant.logo && restaurant.logo.public_id) {
          try {
            await deleteFromCloudinary(restaurant.logo.public_id);
          } catch (deleteError) {
            console.error('Error deleting old logo:', deleteError);
            // Continue with upload even if delete fails
          }
        }
        
        // Upload new logo
        const cloudinaryResponse = await uploadToCloudinary(req.file.buffer, 'restaurants');
        if (!cloudinaryResponse || !cloudinaryResponse.public_id || !cloudinaryResponse.url) {
          throw new Error('Invalid response from Cloudinary');
        }
        logoData = cloudinaryResponse;
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ 
          message: "Error uploading image",
          error: uploadError.message 
        });
      }
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

    // Parse operatingHours if it's a string
    let parsedOperatingHours = operatingHours;
    if (typeof operatingHours === 'string') {
      try {
        parsedOperatingHours = JSON.parse(operatingHours);
      } catch (e) {
        console.error('Error parsing operating hours:', e);
        parsedOperatingHours = restaurant.operatingHours;
      }
    }

    const updateData = {
      name,
      description,
      address: {
        street: address.street || "",
        city: address.city,
        country: address.country || "Pakistan",
        postalCode: address.postalCode || "",
      },
      contact: {
        phone: contact.phone,
        email: contact.email || "",
      },
      cuisineType: parsedCuisineType,
      deliveryAvailable: deliveryAvailable === 'true' || deliveryAvailable === true,
      minimumOrderAmount: Number(minimumOrderAmount) || 0,
      averageDeliveryTime: Number(averageDeliveryTime) || 30,
      operatingHours: parsedOperatingHours,
      logo: logoData,
      isActive: restaurant.isActive
    };

    console.log('Updating restaurant with data:', updateData);

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedRestaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json(updatedRestaurant);
  } catch (error) {
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
router.get("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .select("name address contact cuisineType deliveryAvailable logo description rating minimumOrderAmount")
      .lean();

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Get latest rating stats
    const Review = require("../models/Review");
    const stats = await Review.aggregate([
      {
        $match: {
          restaurant: restaurant._id,
          status: "approved"
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating"
          }
        }
      }
    ]);

    // Process rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (stats.length > 0) {
      stats[0].ratingDistribution.forEach(rating => {
        distribution[rating] = (distribution[rating] || 0) + 1;
      });
    }

    const rating = stats.length > 0 ? {
      average: stats[0].averageRating,
      total: stats[0].totalReviews,
      distribution
    } : {
      average: 0,
      total: 0,
      distribution
    };

    // Update restaurant rating in database
    await Restaurant.findByIdAndUpdate(restaurant._id, {
      rating: {
        average: rating.average,
        total: rating.total,
        distribution: rating.distribution
      }
    });

    console.log('Sending restaurant data:', {
      ...restaurant,
      rating
    });

    res.json({
      ...restaurant,
      rating
    });
  } catch (error) {
    console.error("Fetch restaurant error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
