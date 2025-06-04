import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { FaStar, FaQuoteLeft } from 'react-icons/fa';
import { getReviews } from '../services/api';
import '../assets/ReviewSlider.css';

const ReviewSlider = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await getReviews();
        console.log('Fetched reviews:', response.data);
        if (response.data && response.data.reviews) {
          setReviews(response.data.reviews);
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const settings = {
    dots: true,
    infinite: reviews.length > 3,
    speed: 500,
    slidesToShow: Math.min(3, reviews.length),
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(2, reviews.length),
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  if (loading) {
    return <div className="review-slider-loading">Loading reviews...</div>;
  }

  if (error) {
    return <div className="review-slider-error">{error}</div>;
  }

  if (!reviews.length) {
    return null;
  }

  return (
    <section className="review-slider-section">
      <div className="review-slider-container">
        <h2 className="review-slider-title">What Our Customers Say</h2>
        <Slider {...settings} className="review-slider">
          {reviews.map((review) => (
            <div key={review._id} className="review-card">
              <div className="review-content">
                <FaQuoteLeft className="quote-icon" />
                <p className="review-text">{review.comment}</p>
                <div className="review-rating">
                  {[...Array(5)].map((_, index) => (
                    <FaStar
                      key={index}
                      className={`star ${index < review.rating ? 'filled' : ''}`}
                    />
                  ))}
                </div>
                <div className="review-author">
                  <div className="author-info">
                    <h4>{review.userId?.name || 'Anonymous'}</h4>
                    <p>{review.restaurantId?.name || 'Restaurant'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default ReviewSlider; 