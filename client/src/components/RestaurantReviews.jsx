import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar } from 'react-icons/fa';
import styles from '../assets/Menu.module.css';

const RestaurantReviews = ({ restaurantId }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await axios.get(`/api/reviews/restaurant/${restaurantId}`);
                // Sort reviews by date, newest first
                const sortedReviews = response.data.sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                console.log('Fetched reviews:', sortedReviews); // Debug log
                setReviews(sortedReviews);
            } catch (err) {
                console.error('Error fetching reviews:', err);
                setError(err.response?.data?.message || 'Failed to fetch reviews');
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [restaurantId]);

    if (loading) return <div className={styles.loading}>Loading reviews...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.reviewsSection}>
            <h2>Customer Reviews</h2>
            {reviews.length === 0 ? (
                <div className={styles.noReviews}>No reviews yet</div>
            ) : (
                <div className={styles.reviewsList}>
                    {reviews.map((review) => {
                        // Get the first product from the order items
                        const product = review.orderId?.items?.[0]?.product;
                        console.log('Product data:', product); // Debug log

                        return (
                            <div key={review._id} className={styles.reviewCard}>
                                <div className={styles.reviewHeader}>
                                    <div className={styles.reviewProduct}>
                                        <div className={styles.reviewProductImage}>
                                            <img
                                                src={product?.image?.url || 'https://via.placeholder.com/60x60?text=No+Image'}
                                                alt={product?.name || 'Product'}
                                                onError={(e) => {
                                                    e.target.src = 'https://via.placeholder.com/60x60?text=No+Image';
                                                }}
                                            />
                                        </div>
                                        <div className={styles.reviewProductInfo}>
                                            <h4 className={styles.reviewProductName}>
                                                {product?.name || 'Product'}
                                            </h4>
                                            <p className={styles.reviewProductCategory}>
                                                {product?.category?.name || 'Uncategorized'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={styles.reviewRating}>
                                        {[...Array(5)].map((_, index) => (
                                            <FaStar
                                                key={index}
                                                color={index < review.rating ? '#ff5733' : '#e2e8f0'}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <p className={styles.reviewComment}>{review.comment}</p>

                                <div className={styles.reviewerInfo}>
                                    <div className={styles.reviewerAvatar}>
                                        {review.userId?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className={styles.reviewerName}>{review.userId?.name || 'Anonymous'}</p>
                                        <p className={styles.reviewerRole}>Customer</p>
                                    </div>
                                    <span className={styles.reviewDate}>
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RestaurantReviews; 