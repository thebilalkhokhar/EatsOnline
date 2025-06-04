import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { getOrderDetails, updateOrderStatus } from "../../services/api";
import "../../assets/AdminOrderDetails.css";

function OrderDetails() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, token } = useContext(AuthContext);
  const { orderId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setError("Access denied. Admins only.");
      setLoading(false);
      navigate("/login");
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await getOrderDetails(orderId); // Removed token parameter
        console.log("Order details fetched:", res.data);
        setOrder(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load order details");
        console.error("Fetch error:", err.response?.data);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, user, navigate]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      console.log("Updating status:", { orderId, newStatus });
      const res = await updateOrderStatus(orderId, { status: newStatus });
      console.log("Update response:", res.data);
      
      // Fetch updated order details
      const updatedOrder = await getOrderDetails(orderId);
      setOrder(updatedOrder.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
      console.error("Update error:", err);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!order) return <div className="error">Order not found</div>;

  return (
    <div className="admin-order-details-container">
      <button className="back-btn" onClick={() => navigate("/admin/orders")}>
        ← Back to Orders
      </button>
      <h1>Order Details</h1>
      <div className="order-summary">
        <h2>Order #{order._id.slice(-6)}</h2>
        <p>
          <strong>Customer:</strong> {order.user.name} ({order.user.email})
        </p>
        <p>
          <strong>Date:</strong> {formatDate(order.createdAt)}
        </p>
        <p>
          <strong>Total:</strong> PKR {order.totalPrice.toFixed(2)}
        </p>
        <p>
          <strong>Payment Method:</strong> {order.paymentMethod}
        </p>
        <p>
          <strong>Delivery Address:</strong> {order.deliveryAddress}
        </p>
        <div className="status-update">
          <label>
            <strong>Status:</strong>
          </label>
          <select
            value={order.status || "Pending"}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            className={`status ${(order.status || "Pending").toLowerCase().replace(/\s+/g, '-')}`}
          >
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Preparing">Preparing</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="order-items">
        <h3>Items</h3>
        {order.items.map((item) => (
          <div key={item.product._id} className="item-card">
            <img
              src={item.product.image?.url || "https://via.placeholder.com/80"}
              alt={item.product.name}
            />
            <div className="item-details">
              <h4>{item.product.name}</h4>
              <p>Quantity: {item.quantity}</p>
              <p>
                Price: PKR {item.product.price} x {item.quantity} = PKR{" "}
                {(item.product.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="status-timeline">
        <h3>Order Status Timeline</h3>
        <div className="timeline">
          {[
            "Pending",
            "Confirmed",
            "Preparing",
            "Out for Delivery",
            "Delivered",
          ].map((status, index) => (
            <div
              key={status}
              className={`timeline-step ${
                (order.status || "Pending") === status ||
                index <
                  [
                    "Pending",
                    "Confirmed",
                    "Preparing",
                    "Out for Delivery",
                    "Delivered",
                  ].indexOf(order.status || "Pending")
                  ? "completed"
                  : ""
              }`}
            >
              <span className="dot"></span>
              <p>{status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
