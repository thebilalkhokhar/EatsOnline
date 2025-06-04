import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";
import { FaSpinner, FaUserCircle } from "react-icons/fa";
import "../assets/ProfileSettings.css";
import { getProfile } from '../services/api';

// Add axios base URL configuration
axios.defaults.baseURL = "http://localhost:5000";

function ProfileSettings() {
  const { user, setUser, token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.addresses?.[0] || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Show loading toast
    const loadingToast = toast.loading("Saving changes...");
    
    // Start loading state
    setIsLoading(true);
    // Record start time
    const startTime = Date.now();

    try {
      // Create FormData object
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);
      
      // Only add address if it's not empty
      if (formData.address.trim()) {
        formDataToSend.append('address', formData.address.trim());
      }

      console.log('Sending data:', {
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      });

      const response = await axios.put("/api/auth/profile", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        // Calculate how much time has passed
        const elapsedTime = Date.now() - startTime;
        // If less than 1 second has passed, wait the remaining time
        if (elapsedTime < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000 - elapsedTime));
        }

        // Fetch the latest profile from the backend
        try {
          const latest = await getProfile();
          if (latest.data) {
            setUser(latest.data);
          }
        } catch (err) {
          // fallback to previous logic if fetch fails
          setUser(prev => ({
            ...prev,
            ...response.data
          }));
        }
        // Update success toast
        toast.update(loadingToast, {
          render: "Profile updated successfully! 🎉",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (error) {
      // Calculate how much time has passed
      const elapsedTime = Date.now() - startTime;
      // If less than 1 second has passed, wait the remaining time
      if (elapsedTime < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsedTime));
      }

      console.error('Error details:', error.response?.data); // Debug log

      // Update error toast
      toast.update(loadingToast, {
        render: error.response?.data?.message || "Error updating profile",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Profile update error:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-settings">
      <h2>Profile Settings</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Address</label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="3"
            placeholder="Enter your delivery address"
          />
        </div>

        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? (
            <>
              <FaSpinner className="spinner" /> Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
    </div>
  );
}

export default ProfileSettings; 