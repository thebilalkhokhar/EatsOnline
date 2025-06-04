import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderAndReview = async () => {
      try {
        const [orderResponse, reviewResponse] = await Promise.all([
          axios.get(`/api/orders/${orderId}`),
          axios.get(`/api/reviews/order/${orderId}`)
        ]);
        setOrder(orderResponse.data);
        setReview(reviewResponse.data);
      } catch (error) {
        if (error.response?.status !== 404) {
          toast.error('Failed to fetch order details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndReview();
  }, [orderId]);

  const handleReviewSubmitted = (newReview) => {
    setReview(newReview);
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (!order) {
    return <div className="text-center py-4">Order not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Order Details</h2>
        <div className="space-y-4">
          <div>
            <span className="font-semibold">Order Status: </span>
            <span className={`px-2 py-1 rounded ${
              order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
              order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {order.status}
            </span>
          </div>
          <div>
            <span className="font-semibold">Total Amount: </span>
            <span>Rs. {order.totalPrice}</span>
          </div>
          <div>
            <span className="font-semibold">Delivery Address: </span>
            <span>{order.deliveryAddress}</span>
          </div>
          <div>
            <span className="font-semibold">Payment Method: </span>
            <span>{order.paymentMethod}</span>
          </div>
          <div>
            <span className="font-semibold">Order Date: </span>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item._id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <span className="font-medium">{item.product.name}</span>
                  <span className="text-gray-500 ml-2">x{item.quantity}</span>
                </div>
                <span>Rs. {item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {order.status === 'Delivered' && !review && (
        <div className="mb-6">
          <ReviewForm orderId={orderId} onReviewSubmitted={handleReviewSubmitted} />
        </div>
      )}

      {review && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Your Review</h3>
          <ReviewList reviews={[review]} />
        </div>
      )}
    </div>
  );
};

export default OrderDetails; 