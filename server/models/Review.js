const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        validate: {
            validator: function(v) {
                return v != null;
            },
            message: 'Order ID cannot be null'
        }
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Drop all existing indexes
const Review = mongoose.model('Review', reviewSchema);
Review.collection.dropIndexes().catch(err => {
    console.log('Error dropping indexes:', err);
});

module.exports = Review; 