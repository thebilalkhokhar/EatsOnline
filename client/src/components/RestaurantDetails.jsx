import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Rating } from '@mui/material';
import ReviewList from './ReviewList';

const RestaurantDetails = () => {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurantAndReviews = async () => {
      try {
        const [restaurantResponse, reviewsResponse] = await Promise.all([
          axios.get(`/api/restaurants/${restaurantId}`),
          axios.get(`/api/reviews/restaurant/${restaurantId}`)
        ]);
        setRestaurant(restaurantResponse.data);
        setReviews(reviewsResponse.data);
      } catch (error) {
        console.error('Error fetching restaurant details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantAndReviews();
  }, [restaurantId]);

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (!restaurant) {
    return <div className="text-center py-4">Restaurant not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">{restaurant.name}</h2>
          <div className="flex items-center">
            <Rating value={restaurant.rating} readOnly precision={0.5} />
            <span className="ml-2 text-gray-600">
              ({restaurant.rating.toFixed(1)})
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <span className="font-semibold">Address: </span>
            <span>
              {restaurant.address.street}, {restaurant.address.city}, {restaurant.address.country}
            </span>
          </div>
          <div>
            <span className="font-semibold">Contact: </span>
            <span>{restaurant.contact.phone}</span>
          </div>
          <div>
            <span className="font-semibold">Cuisine: </span>
            <span>{restaurant.cuisineType.join(', ')}</span>
          </div>
          <div>
            <span className="font-semibold">Delivery Available: </span>
            <span>{restaurant.deliveryAvailable ? 'Yes' : 'No'}</span>
          </div>
          {restaurant.description && (
            <div>
              <span className="font-semibold">Description: </span>
              <p className="text-gray-600 mt-1">{restaurant.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>
        <ReviewList reviews={reviews} />
      </div>
    </div>
  );
};

export default RestaurantDetails; 