import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import {
  getCart,
  updateCart,
  removeFromCart,
  clearCart,
} from "../../services/api";
import "../../assets/Cart.css";

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const { token } = useContext(AuthContext);
  const { refreshCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await getCart(token);
        setCart(res.data.cart);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load cart");
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [token]);

  const handleQuantityChange = async (productId, change) => {
    if (updating) return;
    setUpdating(true);

    try {
      const item = cart.items.find((item) => item.product?._id === productId);
      if (!item) {
        throw new Error("Item not found in cart");
      }

      const newQuantity = Math.max(1, item.quantity + change);

      setCart((prevCart) => ({
        ...prevCart,
        items: prevCart.items.map((item) =>
          item.product?._id === productId
            ? { ...item, quantity: newQuantity }
            : item
        ),
      }));

      const res = await updateCart({ productId, quantity: newQuantity }, token);
      setCart(res.data.cart);
      refreshCart();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update quantity");
      try {
        const res = await getCart(token);
        setCart(res.data.cart);
      } catch (revertErr) {
        setError("Failed to sync cart");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      const res = await removeFromCart(productId, token);
      setCart(res.data.cart);
      refreshCart();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove item");
    }
  };

  const handleClearCart = async () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      try {
        await clearCart(token);
        setCart({ items: [] });
        refreshCart();
      } catch (err) {
        setError(err.response?.data?.message || "Failed to clear cart");
      }
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.items.length) return 0;
    return cart.items.reduce(
      (total, item) => total + (item.product?.price || 0) * item.quantity,
      0
    );
  };

  const validateCartItems = () => {
    if (!cart || !cart.items.length) {
      setError("Your cart is empty. Add items to proceed.");
      return { isValid: false, restaurantId: null };
    }
    const restaurantIds = cart.items
      .map((item) => item.product?.restaurantId?.toString())
      .filter((id) => id);
    if (restaurantIds.length === 0) {
      setError("No valid restaurant found for items in your cart.");
      return { isValid: false, restaurantId: null };
    }
    if (restaurantIds.length !== cart.items.length) {
      setError("Some items have invalid restaurant data. Please remove them.");
      return { isValid: false, restaurantId: null };
    }
    const uniqueRestaurantIds = new Set(restaurantIds);
    if (uniqueRestaurantIds.size > 1) {
      setError("All items in the cart must belong to the same restaurant.");
      return { isValid: false, restaurantId: null };
    }
    return { isValid: true, restaurantId: restaurantIds[0] };
  };

  const handleCheckout = () => {
    setError(""); // Clear previous errors
    const { isValid, restaurantId } = validateCartItems();
    if (!isValid) {
      return; // Error message is already set in validateCartItems
    }
    if (!restaurantId) {
      setError("Unable to determine restaurant. Please try again.");
      return;
    }
    navigate("/checkout", { state: { restaurantId } });
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="cart-container">
      <h1>Your Cart</h1>
      {cart && cart.items.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty!</p>
          <button onClick={() => navigate("/")}>Start Shopping</button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart?.items.map((item) => (
              <div key={item.product?._id} className="cart-item">
                <img
                  src={item.product?.image?.url || "https://via.placeholder.com/100"}
                  alt={item.product?.name || "Product"}
                />
                <div className="item-details">
                  <h3>{item.product?.name || "Unnamed Product"}</h3>
                  <p>Price: PKR {item.product?.price?.toFixed(2) || 0}</p>
                  <div className="quantity-control">
                    <button
                      onClick={() =>
                        handleQuantityChange(item.product?._id, -1)
                      }
                      disabled={item.quantity <= 1 || updating}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.product?._id, 1)}
                      disabled={updating}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => handleRemove(item.product?._id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h2>Total: PKR {calculateTotal().toFixed(2)}</h2>
            <div className="cart-actions">
              <button className="clear-btn" onClick={handleClearCart}>
                Clear Cart
              </button>
              <button className="checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
