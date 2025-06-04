import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { getCart, placeOrder, getProfile } from "../../services/api";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "react-toastify";
import "./../../assets/Checkout.css";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function Checkout() {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [formData, setFormData] = useState({
    deliveryAddress: "",
    paymentMethod: "Cash on Delivery",
  });
  const [loading, setLoading] = useState(false);
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurantId } = location.state || {};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cartRes = await getCart(token);
        setCart(cartRes.data.cart);

        const profileRes = await getProfile(token);
        setAddresses(profileRes.data.addresses || []);
        if (profileRes.data.addresses.length > 0) {
          setFormData((prev) => ({
            ...prev,
            deliveryAddress: profileRes.data.addresses[0],
          }));
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load checkout data");
      }
    };
    fetchData();
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateTotal = () => {
    if (!cart || !cart.items || !cart.items.length) return 0;
    return cart.items.reduce(
      (total, item) => total + item.quantity * item.product.price,
      0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.deliveryAddress) {
      toast.error("Delivery address is required");
      return;
    }
    if (!restaurantId || typeof restaurantId !== "string") {
      toast.error("Invalid or missing restaurant. Please go back and try again.");
      return;
    }

    const loadingToast = toast.loading("Processing your order...");
    setLoading(true);

    try {
      const profileRes = await getProfile(token);
      const userId = user?.id || profileRes.data.id;
      
      if (!userId) {
        throw new Error("User ID not found. Please log in again.");
      }

      const orderData = {
        ...formData,
        restaurantId,
        items: cart?.items?.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
        })) || [],
        total: calculateTotal(),
        userId,
      };

      if (formData.paymentMethod === "Online") {
        if (!orderData.items.length) {
          throw new Error("Cart is empty, nothing to checkout with online payment");
        }

        const apiUrl = import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000";
        const endpoint = `${apiUrl}/api/create-checkout-session`;
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          const text = await response.text();
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
          } catch (jsonError) {
            throw new Error(`Unexpected response: ${text}`);
          }
        }

        const session = await response.json();
        const stripe = await stripePromise;
        
        // Create order first
        const orderResponse = await placeOrder({
          ...orderData,
          paymentMethod: "Online",
          stripeSessionId: session.id
        });

        // Then redirect to Stripe
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: session.id,
        });

        if (stripeError) {
          throw new Error(stripeError.message);
        }
      } else {
        const res = await placeOrder(orderData);
        toast.update(loadingToast, {
          render: `Order placed successfully! Order ID: ${res.data.orderId} 🎉`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        setTimeout(() => navigate("/orders"), 2000);
      }
    } catch (err) {
      toast.update(loadingToast, {
        render: err.message || "Failed to place order",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!cart) return <div className="loading">Loading...</div>;
  if (cart?.items?.length === 0) return <div className="empty">Your cart is empty!</div>;

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      <div className="checkout-content">
        <div className="cart-summary">
          <h2>Order Summary</h2>
          {cart?.items?.map((item) => (
            <div key={item.product._id} className="summary-item">
              <img
                src={item.product.image?.url || "https://via.placeholder.com/50"}
                alt={item.product.name}
              />
              <div>
                <p>{item.product.name}</p>
                <p>
                  {item.quantity} x PKR {item.product.price} = PKR{" "}
                  {(item.quantity * item.product.price).toFixed(2)}
                </p>
              </div>
            </div>
          )) || <p>No items in cart</p>}
          <h3>Total: PKR {calculateTotal().toFixed(2)}</h3>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <h2>Delivery Details</h2>
          <label>Delivery Address</label>
          <select
            name="deliveryAddress"
            value={formData.deliveryAddress}
            onChange={handleChange}
            className="address-select"
          >
            <option value="">Select or enter new address</option>
            {addresses.map((addr, index) => (
              <option key={index} value={addr}>
                {addr}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="deliveryAddress"
            value={formData.deliveryAddress}
            onChange={handleChange}
            placeholder="Enter new delivery address"
            disabled={addresses.includes(formData.deliveryAddress)}
          />

          <label>Payment Method</label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
          >
            <option value="Cash on Delivery">Cash on Delivery</option>
            <option value="Online">Online Payment</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Checkout;
