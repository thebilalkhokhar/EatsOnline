import React from 'react';
import { Rating } from '@mui/material';
import { format } from 'date-fns';

const ReviewList = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No reviews yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review._id} className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="font-semibold text-gray-800">
                {review.user?.name || 'Anonymous'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {format(new Date(review.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="mb-2">
            <Rating value={review.rating} readOnly size="small" />
          </div>
          {review.comment && (
            <p className="text-gray-600">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReviewList; 