import { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { getCart } from "../services/api";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const { token, isAuthenticated } = useContext(AuthContext);

  const fetchCart = async () => {
    if (!isAuthenticated || !token) {
      setCartItems([]);
      setCartCount(0);
      return;
    }

    try {
      const res = await getCart(token);
      const items = res.data.cart.items || [];
      setCartItems(items);
      // Calculate total quantity of all items
      const totalQuantity = items.reduce((total, item) => total + (item.quantity || 0), 0);
      setCartCount(totalQuantity);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setCartItems([]);
      setCartCount(0);
    }
  };

  // Fetch cart when auth state changes
  useEffect(() => {
    fetchCart();
  }, [isAuthenticated, token]);

  const value = {
    cartItems,
    cartCount,
    refreshCart: fetchCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}; 