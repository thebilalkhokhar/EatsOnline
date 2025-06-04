import { createContext, useState, useEffect } from "react";

// Create AuthContext for global state management
export const AuthContext = createContext();

/**
 * AuthProvider component to manage authentication state and provide it to the app
 * @param {Object} props - React props
 * @param {ReactNode} props.children - Child components to render within the provider
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(sessionStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem("token", token);
    } else {
      sessionStorage.removeItem("token");
    }
    if (user) {
      sessionStorage.setItem("user", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("user");
    }
    setLoading(false);
  }, [token, user]);

  const login = (authToken, userData) => {
    if (!authToken || !userData) {
      console.error("Invalid login data:", { authToken, userData });
      return;
    }
    console.log('Setting user data:', userData); // Debug log
    
    // Use the profileImage data directly from the server
    setToken(authToken);
    setUser({
      ...userData,
      restaurantId: userData.restaurantId || null
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setLoading(false);
    sessionStorage.clear();
  };

  const contextValue = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    setUser, // Adding setUser to context for manual updates
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
