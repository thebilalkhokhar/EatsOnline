import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FaArrowLeft } from "react-icons/fa";
import { getAdminOrders, updateOrderStatus } from "../../services/api";
import "../../assets/AdminCommon.css";
import "../../assets/AdminOrders.css";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token || !user || user.role !== "admin") {
        setError("Access denied. Admins only.");
        setLoading(false);
        navigate("/login");
        return;
      }
      try {
        const res = await getAdminOrders(token, user.restaurantId); // Filter by restaurantId
        setOrders(res.data);
        setFilteredOrders(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token, user, navigate]);

  useEffect(() => {
    if (filter === "All") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((order) => order.status === filter));
    }
  }, [filter, orders]);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await updateOrderStatus(orderId, { status: newStatus });
      console.log("Status update response:", res);
      
      // Refresh the orders list
      const updatedOrders = await getAdminOrders(token, user.restaurantId);
      setOrders(updatedOrders.data);
      setFilteredOrders(
        filter === "All" 
          ? updatedOrders.data 
          : updatedOrders.data.filter(order => order.status === filter)
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
      console.error("Update error:", err);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-orders-container">
      <button className="back-btn" onClick={() => navigate("/admin/dashboard")}>
        <FaArrowLeft /> Back to Dashboard
      </button>
      <h1>Manage Orders</h1>
      <div className="filter-section">
        <label>Filter by Status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Preparing">Preparing</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
      <div className="orders-table">
        <div className="table-header">
          <span>Order ID</span>
          <span>Customer</span>
          <span>Date & Time</span>
          <span>Total</span>
          <span>Payment Method</span>
          <span>Actions</span>
          <span>Status</span>
        </div>
        {filteredOrders.length === 0 ? (
          <p>No orders found</p>
        ) : (
          filteredOrders.map((order) => {
            const { date, time } = formatDateTime(order.createdAt);
            return (
              <div key={order._id} className="table-row">
                <span>#{order._id.slice(-6)}</span>
                <span>{order.user?.name || "Unknown"}</span>
                <span>
                  {date} <br /> {time}
                </span>
                <span>PKR {order.totalPrice?.toFixed(2) || "0.00"}</span>
                <span>{order.paymentMethod || "N/A"}</span>
                <button onClick={() => navigate(`/admin/orders/${order._id}`)}>
                  Details
                </button>
                <select
                  value={order.status}
                  onChange={(e) =>
                    handleStatusUpdate(order._id, e.target.value)
                  }
                  className={`status ${order.status.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Orders;
