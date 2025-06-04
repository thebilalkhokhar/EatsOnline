import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { getOrders } from "../../services/api";
import "../../assets/Orders.css";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle payment success
  useEffect(() => {
    const updateOrderStatus = async () => {
      const params = new URLSearchParams(location.search);
      const sessionId = params.get("session_id");
      
      if (sessionId) {
        try {
          const apiUrl = import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000";
          const response = await fetch(`${apiUrl}/api/payment-success`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ sessionId }),
          });

          if (!response.ok) {
            throw new Error("Failed to update order status");
          }

          // Remove session_id from URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, "", newUrl);
          
          // Refresh orders
          fetchOrders();
        } catch (error) {
          console.error("Error updating order status:", error);
        }
      }
    };

    updateOrderStatus();
  }, [location.search, token]);

  // Fetch orders
  const fetchOrders = async () => {
    if (!token || !user) {
      setError("Please log in to view your orders.");
      setLoading(false);
      navigate("/login");
      return;
    }
    try {
      const res = await getOrders(user._id, user.role);
      setOrders(res.data || []); // Ensure orders is an array
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [token, user, navigate]);

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Handle order details navigation
  const handleOrderDetails = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="orders-container">
      <h1>Your Orders</h1>
      {orders.length === 0 ? (
        <div className="empty-orders">
          <p>You haven't placed any orders yet!</p>
          <button onClick={() => navigate("/")}>Start Shopping</button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <h3>Order #{order._id.slice(-6)}</h3>
                <span className={`status ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {order.status}
                </span>
              </div>
              <div className="order-details">
                <p>
                  <strong>Date & Time:</strong>{" "}
                  {formatDateTime(order.createdAt)}
                </p>
                <p>
                  <strong>Restaurant:</strong>{" "}
                  {order.restaurantId?.name || "Unknown Restaurant"}
                </p>
                <p>
                  <strong>Total:</strong> PKR{" "}
                  {order.totalPrice?.toFixed(2) || "0.00"}
                </p>
                <p>
                  <strong>Payment Method:</strong>{" "}
                  {order.paymentMethod || "N/A"}
                </p>
                <p>
                  <strong>Items:</strong> {order.items.length}{" "}
                  {order.items.length > 0 && (
                    <span>
                      (e.g., {order.items[0].quantity} x{" "}
                      {order.items[0].product?.name || "Unknown Item"})
                    </span>
                  )}
                </p>
              </div>
              <button
                className="details-btn"
                onClick={() => handleOrderDetails(order._id)}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
