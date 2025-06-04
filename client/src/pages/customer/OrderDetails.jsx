import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { getOrderDetails } from "../../services/api";
import ReviewForm from "../../components/ReviewForm";
import axios from "axios";
import styles from "../../assets/OrderDetails.module.css";

function OrderDetails() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [review, setReview] = useState(null);
  const { token } = useContext(AuthContext);
  const { orderId } = useParams(); // URL se order ID lo
  const navigate = useNavigate();

  // Fetch order details and review
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orderRes, reviewRes] = await Promise.all([
          getOrderDetails(orderId, token),
          axios.get(`/api/reviews/order/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: null }))
        ]);
        console.log('Order data:', orderRes.data); // Debug log
        console.log('Restaurant data:', orderRes.data.restaurantId); // Debug log
        setOrder(orderRes.data);
        setReview(reviewRes.data);
      } catch (err) {
        console.error('Error fetching order details:', err); // Debug log
        setError(err.response?.data?.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId, token]);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReviewSubmitted = (reviewData) => {
    setReview(reviewData);
    setShowReviewForm(false);
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!order) return <div className={styles.error}>Order not found</div>;

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate("/orders")}>
        ← Back to Orders
      </button>
      <h1 className={styles.title}>Order Details</h1>
      <div className={styles.orderSummary}>
        <h2>Order #{order._id.slice(-6)}</h2>
        <div className={styles.orderInfo}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Date</span>
            <span className={styles.infoValue}>{formatDate(order.createdAt)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Restaurant</span>
            <span className={styles.infoValue}>{order.restaurantId?.name || "Loading..."}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Total</span>
            <span className={styles.infoValue}>PKR {order.totalPrice.toFixed(2)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Status</span>
            <span className={`${styles.status} ${styles[order.status.toLowerCase().replace(/\s+/g, '-')]}`}>
              {order.status}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Payment Method</span>
            <span className={styles.infoValue}>{order.paymentMethod}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Delivery Address</span>
            <span className={styles.infoValue}>{order.deliveryAddress}</span>
          </div>
        </div>
      </div>

      <div className={styles.orderItems}>
        <h3>Items</h3>
        <div className={styles.itemsList}>
          {order.items.map((item) => (
            <div key={item.product._id} className={styles.itemCard}>
              <img
                src={item.product.image?.url || "https://via.placeholder.com/80"}
                alt={item.product.name}
                className={styles.itemImage}
              />
              <div className={styles.itemDetails}>
                <h4 className={styles.itemName}>{item.product.name}</h4>
                <p className={styles.itemQuantity}>Quantity: {item.quantity}</p>
                <p className={styles.itemPrice}>
                  Price: PKR {item.product.price} x {item.quantity} = PKR{" "}
                  {(item.product.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.timeline}>
        <h3>Order Status Timeline</h3>
        <div className={styles.timelineSteps}>
          {[
            "Pending",
            "Confirmed",
            "Preparing",
            "Out for Delivery",
            "Delivered",
          ].map((status, index) => (
            <div
              key={status}
              className={`${styles.timelineStep} ${
                order.status === status ||
                index <
                  [
                    "Pending",
                    "Confirmed",
                    "Preparing",
                    "Out for Delivery",
                    "Delivered",
                  ].indexOf(order.status)
                  ? styles.completed
                  : ""
              }`}
            >
              <span className={styles.timelineDot}></span>
              <p className={styles.timelineLabel}>{status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Review Section */}
      {order.status === "Delivered" && !review && (
        <div className={styles.reviewSection}>
          {/* <h3>Leave a Review</h3> */}
          <ReviewForm
            orderId={orderId}
            onReviewSubmitted={handleReviewSubmitted}
          />
        </div>
      )}

      {review && (
        <div className={styles.reviewSection}>
          <h3>Your Review</h3>
          <div className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <div className={styles.reviewRating}>
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`${styles.star} ${i < review.rating ? styles.filled : ""}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className={styles.reviewDate}>
                {formatDate(review.createdAt)}
              </span>
            </div>
            <p className={styles.reviewComment}>{review.comment}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetails;
