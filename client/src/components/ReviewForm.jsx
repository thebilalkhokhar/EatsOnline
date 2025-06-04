import React, { useState } from 'react';
import { Rating } from '@mui/material';
import { toast } from 'react-toastify';
import axios from 'axios';
import styles from '../assets/Reviews.module.css';
import { useNavigate } from "react-router-dom";

const ReviewForm = ({ orderId, restaurantId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation checks
    if (!rating) {
      toast.error("Please select a rating");
      return;
    }
    if (!review.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    if (!restaurantId) {
      toast.error('Restaurant ID is required');
      return;
    }
    if (!orderId) {
      toast.error('Order ID is required');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your review...");

    try {
      // Get token from session storage
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.update(toastId, {
          render: "Please log in to submit a review",
          type: "error",
          isLoading: false,
          autoClose: 3000
        });
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/reviews`,
        {
          orderId,
          restaurantId,
          rating,
          review: review.trim()
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Update loading toast to success
      toast.update(toastId, {
        render: "Review submitted successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000
      });

      if (onSuccess) {
        onSuccess(response.data);
      }

      // Reset form
      setRating(0);
      setReview('');
    } catch (err) {
      // Update loading toast to error
      toast.update(toastId, {
        render: err.response?.data?.message || "Failed to submit review",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.reviewForm}>
      <h3 className={styles.formTitle}>Write a Review</h3>
      
      <div className={styles.ratingContainer}>
        <Rating
          name="rating"
          value={rating}
          onChange={(_, newValue) => setRating(newValue)}
          size="large"
          precision={1}
        />
      </div>

      <div className={styles.textareaContainer}>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          className={styles.textarea}
          rows="4"
          maxLength={500}
          placeholder="Share your experience with this restaurant..."
          disabled={isSubmitting}
        />
        <p className={styles.charCount}>
          {review.length}/500 characters
        </p>
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isSubmitting || rating === 0}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};

export default ReviewForm; 