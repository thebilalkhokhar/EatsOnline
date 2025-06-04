const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { authMiddleware } = require('../middleware/auth');
const Order = require('../models/Order');

// Create a review
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { orderId, rating, comment } = req.body;
        console.log('Received review submission:', { 
            orderId, 
            rating, 
            comment,
            userId: req.user.userId 
        });

        // Validate required fields
        if (!orderId) {
            console.log('Missing orderId');
            return res.status(400).json({ message: 'Order ID is required' });
        }
        if (!rating || rating < 1 || rating > 5) {
            console.log('Invalid rating:', rating);
            return res.status(400).json({ message: 'Valid rating (1-5) is required' });
        }
        if (!comment || comment.trim().length === 0) {
            console.log('Missing or empty comment');
            return res.status(400).json({ message: 'Comment is required' });
        }

        // Check if order exists and is delivered
        const order = await Order.findById(orderId).populate('user', 'name email');
        console.log('Found order:', order ? {
            id: order._id,
            status: order.status,
            restaurantId: order.restaurantId,
            userId: order.user._id.toString(),
            userName: order.user.name,
            userEmail: order.user.email
        } : 'Not found');

        if (!order) {
            console.log('Order not found:', orderId);
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if the order belongs to the user
        if (order.user._id.toString() !== req.user.userId) {
            console.log('Order does not belong to user:', {
                orderUserId: order.user._id.toString(),
                requestUserId: req.user.userId
            });
            return res.status(403).json({ message: 'You can only review your own orders' });
        }

        // Check order status
        if (order.status !== 'Delivered') {
            console.log('Order not delivered:', {
                orderId: order._id,
                status: order.status,
                requiredStatus: 'Delivered'
            });
            return res.status(400).json({ 
                message: `Can only review delivered orders. Current order status: ${order.status}` 
            });
        }

        // Check if user has already reviewed this order
        let existingReview = await Review.findOne({ 
            orderId: orderId,
            userId: req.user.userId 
        });
        
        console.log('Checking for existing review:', {
            orderId,
            userId: req.user.userId,
            found: !!existingReview,
            reviewId: existingReview?._id
        });

        if (existingReview) {
            console.log('Found existing review:', {
                id: existingReview._id,
                orderId: existingReview.orderId,
                userId: existingReview.userId,
                rating: existingReview.rating,
                comment: existingReview.comment
            });
            // Update the existing review
            existingReview.rating = rating;
            existingReview.comment = comment.trim();
            await existingReview.save();
            console.log('Updated existing review:', existingReview._id);
            
            // Populate the updated review
            const populatedReview = await Review.findById(existingReview._id)
                .populate('userId', 'name')
                .populate({
                    path: 'orderId',
                    select: 'items',
                    populate: {
                        path: 'items.product',
                        select: 'name image category description',
                        populate: {
                            path: 'category',
                            select: 'name'
                        }
                    }
                });
            
            return res.status(200).json(populatedReview);
        }

        // Create new review if no existing review found
        const review = new Review({
            orderId,
            userId: req.user.userId,
            restaurantId: order.restaurantId,
            rating,
            comment: comment.trim()
        });

        console.log('Creating new review:', {
            orderId: review.orderId,
            userId: review.userId,
            restaurantId: review.restaurantId,
            rating: review.rating
        });
        
        try {
            // Save the review
            await review.save();
            console.log('Review saved successfully:', {
                id: review._id,
                orderId: review.orderId,
                userId: review.userId
            });
            
            // Populate the review with user details before sending response
            const populatedReview = await Review.findById(review._id)
                .populate('userId', 'name')
                .populate({
                    path: 'orderId',
                    select: 'items',
                    populate: {
                        path: 'items.product',
                        select: 'name image category description',
                        populate: {
                            path: 'category',
                            select: 'name'
                        }
                    }
                });
            
            console.log('Sending populated review response');
            res.status(201).json(populatedReview);
        } catch (saveError) {
            console.error('Error saving review:', saveError);
            if (saveError.code === 11000) {
                // If we get a duplicate key error, try to find and update the existing review
                const existingReview = await Review.findOne({ 
                    orderId: orderId,
                    userId: req.user.userId 
                });
                
                if (existingReview) {
                    existingReview.rating = rating;
                    existingReview.comment = comment.trim();
                    await existingReview.save();
                    
                    const populatedReview = await Review.findById(existingReview._id)
                        .populate('userId', 'name')
                        .populate({
                            path: 'orderId',
                            select: 'items',
                            populate: {
                                path: 'items.product',
                                select: 'name image category description',
                                populate: {
                                    path: 'category',
                                    select: 'name'
                                }
                            }
                        });
                    
                    return res.status(200).json(populatedReview);
                }
            }
            throw saveError;
        }
    } catch (error) {
        console.error('Error creating review:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation error', 
                details: Object.values(error.errors).map(err => err.message)
            });
        }
        res.status(500).json({ message: error.message });
    }
});

// Get reviews for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const reviews = await Review.find({ restaurantId: req.params.restaurantId })
            .populate('userId', 'name')
            .populate({
                path: 'orderId',
                select: 'items',
                populate: {
                    path: 'items.product',
                    select: 'name image category description',
                    populate: {
                        path: 'category',
                        select: 'name'
                    }
                }
            })
            .sort({ createdAt: -1 });
        
        // Log the first review to check the structure
        if (reviews.length > 0) {
            console.log('First review structure:', JSON.stringify(reviews[0], null, 2));
        }
        
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get review for a specific order
router.get('/order/:orderId', authMiddleware, async (req, res) => {
    try {
        const review = await Review.findOne({ orderId: req.params.orderId })
            .populate('userId', 'name');
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        res.json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all reviews
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('userId', 'name profileImage')
            .populate('restaurantId', 'name')
            .sort({ createdAt: -1 })
            .limit(10); // Limit to 10 most recent reviews
        
        res.json({ reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 