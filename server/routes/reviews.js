const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const { authMiddleware } = require("../middleware/auth");
const User = require("../models/User");

// Helper function to update restaurant rating statistics
const updateRestaurantRatings = async (restaurantId) => {
  try {
    // Get all approved and pending reviews for the restaurant
    const reviews = await Review.find({
      restaurant: restaurantId,
      status: { $in: ["approved", "pending"] }
    });

    // Calculate statistics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    // Calculate rating distribution
    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length,
    };

    // Update restaurant
    await Restaurant.findByIdAndUpdate(restaurantId, {
      rating: {
        average: averageRating,
        total: totalReviews,
        distribution: ratingDistribution
      }
    });

    return {
      average: averageRating,
      total: totalReviews,
      distribution: ratingDistribution
    };
  } catch (error) {
    console.error("Error updating restaurant ratings:", error);
    throw error;
  }
};

// Create a new review
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { orderId, rating, review, restaurantId } = req.body;

    // Validate required fields
    if (!orderId || !rating || !restaurantId) {
      return res.status(400).json({ 
        message: 'Missing required fields: orderId, rating, and restaurantId are required' 
      });
    }

    // Validate order exists and belongs to user
    const order = await Order.findOne({
      _id: orderId,
      user: req.user.userId,
      status: 'Delivered'
    });

    if (!order) {
      return res.status(404).json({ 
        message: 'Order not found or not eligible for review. Make sure the order is delivered and belongs to you.' 
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already submitted a review for this order' 
      });
    }

    // Create new review
    const reviewData = {
      user: req.user.userId,
      order: orderId,
      restaurant: restaurantId,
      rating: Number(rating),
      review: review || '',
      isVerifiedPurchase: true,
      status: 'approved' // Set status to approved by default
    };

    const newReview = new Review(reviewData);
    await newReview.save();

    // Update restaurant rating
    await updateRestaurantRatings(restaurantId);

    // Populate user and restaurant details
    await newReview.populate('user', 'name');
    await newReview.populate('restaurant', 'name');

    // Send success response
    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: newReview
    });
  } catch (error) {
    console.error('Error creating review:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid review data', 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    return res.status(500).json({ 
      success: false,
      message: 'Failed to submit review', 
      error: error.message 
    });
  }
});

// Get reviews for a restaurant
router.get("/restaurant/:restaurantId", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get approved reviews with pagination
    const reviews = await Review.find({
      restaurant: req.params.restaurantId,
      status: "approved"
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalReviews = await Review.countDocuments({
      restaurant: req.params.restaurantId,
      status: "approved"
    });

    // Get rating statistics
    const stats = await Review.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(req.params.restaurantId),
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

    const responseStats = stats.length > 0 ? {
      averageRating: stats[0].averageRating,
      totalReviews: stats[0].totalReviews,
      distribution
    } : {
      averageRating: 0,
      totalReviews: 0,
      distribution
    };

    // Update restaurant rating
    await Restaurant.findByIdAndUpdate(req.params.restaurantId, {
      rating: {
        average: responseStats.averageRating,
        total: responseStats.totalReviews,
        distribution: responseStats.distribution
      }
    });

    console.log('Sending response:', {
      reviews: reviews.length,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: parseInt(page),
      stats: responseStats
    });

    res.json({
      reviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: parseInt(page),
      stats: responseStats
    });
  } catch (error) {
    console.error('Get restaurant reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get reviews by a user
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ user: req.user.userId })
      .populate("restaurant", "name")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Review.countDocuments({ user: req.user.userId });

    res.json({
      reviews,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalReviews: count
    });
  } catch (error) {
    console.error("Get user reviews error:", error);
    res.status(500).json({ message: "Failed to get reviews" });
  }
});

// Update a review
router.put("/:reviewId", authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, review } = req.body;

    const existingReview = await Review.findOne({
      _id: reviewId,
      user: req.user.userId
    });

    if (!existingReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    existingReview.rating = rating || existingReview.rating;
    existingReview.review = review || existingReview.review;
    existingReview.status = "pending"; // Reset status for re-moderation

    await existingReview.save();

    // Update restaurant rating statistics
    const updatedStats = await updateRestaurantRatings(existingReview.restaurant);
    console.log("Updated restaurant stats after review update:", updatedStats);

    await existingReview.populate("user", "name");

    res.json({
      message: "Review updated successfully",
      review: existingReview,
      restaurantStats: updatedStats
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ message: "Failed to update review" });
  }
});

// Delete a review
router.delete("/:reviewId", authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({
      _id: reviewId,
      user: req.user.userId
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await review.remove();

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ message: "Failed to delete review" });
  }
});

// Vote a review as helpful
router.post("/:reviewId/vote", authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.helpfulVotes += 1;
    await review.save();

    res.json({ message: "Vote recorded successfully", helpfulVotes: review.helpfulVotes });
  } catch (error) {
    console.error("Vote review error:", error);
    res.status(500).json({ message: "Failed to vote review" });
  }
});

// Report a review
router.post("/:reviewId/report", authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.reportCount += 1;
    if (review.reportCount >= 5) { // Auto-hide after 5 reports
      review.status = "rejected";
    }
    await review.save();

    res.json({ message: "Review reported successfully" });
  } catch (error) {
    console.error("Report review error:", error);
    res.status(500).json({ message: "Failed to report review" });
  }
});

// Restaurant owner response to a review
router.post("/:reviewId/respond", authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Verify the user is the restaurant owner
    const restaurant = await Restaurant.findOne({
      _id: review.restaurant,
      owner: req.user.userId
    });

    if (!restaurant) {
      return res.status(403).json({ message: "Not authorized to respond to this review" });
    }

    review.restaurantResponse = {
      text: response,
      respondedAt: new Date()
    };
    await review.save();

    res.json({
      message: "Response added successfully",
      response: review.restaurantResponse
    });
  } catch (error) {
    console.error("Review response error:", error);
    res.status(500).json({ message: "Failed to add response" });
  }
});

// Check if an order has a review
router.get("/check/:orderId", authMiddleware, async (req, res) => {
  try {
    console.log("Checking review for order:", {
      orderId: req.params.orderId,
      userId: req.user.userId
    });

    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) {
      console.log("Invalid order ID format:", req.params.orderId);
      return res.status(400).json({ 
        message: "Invalid order ID format",
        hasReview: false
      });
    }

    // First check if the order exists and belongs to the user
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user.userId
    });

    if (!order) {
      console.log("Order not found or not authorized:", req.params.orderId);
      return res.status(404).json({ 
        message: "Order not found or not authorized",
        hasReview: false
      });
    }

    // Check for existing review
    const review = await Review.findOne({ 
      order: req.params.orderId,
      user: req.user.userId
    });
    
    console.log("Review check result:", {
      orderId: req.params.orderId,
      hasReview: !!review,
      reviewId: review?._id
    });

    res.json({ 
      hasReview: !!review,
      reviewId: review?._id
    });
  } catch (error) {
    console.error("Check review error:", {
      error: error.message,
      stack: error.stack,
      orderId: req.params.orderId,
      userId: req.user?.userId
    });
    res.status(500).json({ 
      message: "Failed to check review status",
      hasReview: false,
      error: error.message
    });
  }
});

// Get featured reviews for home page
router.get('/featured', async (req, res) => {
  try {
    console.log('Fetching featured reviews...');
    
    // Get all reviews first to see what we have
    const allReviews = await Review.find({});
    console.log('Total reviews in database:', allReviews.length);
    console.log('All reviews:', allReviews);

    // Get approved reviews with high ratings
    const featuredReviews = await Review.find({ 
      status: "approved"  // Only show approved reviews
    })
      .populate('user', 'name')
      .populate('restaurant', 'name')
      .sort({ rating: -1, createdAt: -1 })
      .limit(5);

    console.log('Featured reviews count:', featuredReviews.length);
    console.log('Featured reviews:', JSON.stringify(featuredReviews, null, 2));

    if (!featuredReviews || featuredReviews.length === 0) {
      return res.status(404).json({ message: 'No reviews found' });
    }

    res.json(featuredReviews);
  } catch (error) {
    console.error('Error fetching featured reviews:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin route to approve a review
router.patch("/:reviewId/approve", async (req, res) => {  // Removed authMiddleware temporarily
  try {
    const { reviewId } = req.params;

    // Validate reviewId format
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID format" });
    }

    // Find and update the review
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status: "approved" },
      { new: true }
    ).populate('user', 'name')
      .populate('restaurant', 'name');

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Update restaurant rating statistics after approval
    await updateRestaurantRatings(review.restaurant);

    res.json({ 
      message: "Review approved successfully", 
      review 
    });
  } catch (error) {
    console.error("Review approval error:", error);
    res.status(500).json({ message: "Failed to approve review" });
  }
});

// Add test reviews (TEMPORARY ROUTE - REMOVE IN PRODUCTION)
router.post('/add-test-reviews', async (req, res) => {
  try {
    // Get a restaurant and user for test data
    const restaurant = await Restaurant.findOne();
    const user = await User.findOne();
    
    if (!restaurant || !user) {
      return res.status(404).json({ message: 'Restaurant or user not found' });
    }

    // Generate new ObjectIds for orders
    const orderId1 = new mongoose.Types.ObjectId();
    const orderId2 = new mongoose.Types.ObjectId();
    const orderId3 = new mongoose.Types.ObjectId();

    const testReviews = [
      {
        user: user._id,
        restaurant: restaurant._id,
        order: orderId1,
        rating: 5,
        review: "Amazing food! The service was excellent and everything was perfect! ⭐⭐⭐⭐⭐",
        status: "approved"
      },
      {
        user: user._id,
        restaurant: restaurant._id,
        order: orderId2,
        rating: 4,
        review: "Great experience overall. Would definitely come back again! 👍",
        status: "approved"
      },
      {
        user: user._id,
        restaurant: restaurant._id,
        order: orderId3,
        rating: 5,
        review: "Best food I've had in a long time! Highly recommended 🌟",
        status: "approved"
      }
    ];

    const createdReviews = await Review.insertMany(testReviews);
    
    res.json({ 
      message: 'Test reviews added successfully',
      reviews: createdReviews
    });
  } catch (error) {
    console.error('Error adding test reviews:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 