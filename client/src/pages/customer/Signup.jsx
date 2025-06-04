import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { signup } from "../../services/api";
import { toast } from "react-toastify";
import "../../assets/Auth.css";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    addresses: [""],
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address_")) {
      const index = parseInt(name.split("_")[1]);
      setFormData((prev) => {
        const newAddresses = [...prev.addresses];
        newAddresses[index] = value;
        return { ...prev, addresses: newAddresses };
      });
    } else if (name === "phone") {
      let cleanedValue = value.replace(/[^0-9+]/g, "");
      if (cleanedValue.length > 12) {
        cleanedValue = cleanedValue.slice(0, 12);
      }
      setFormData({ ...formData, phone: cleanedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const addAddressField = () => {
    setFormData((prev) => ({
      ...prev,
      addresses: [...prev.addresses, ""],
    }));
  };

  const removeAddressField = (index) => {
    setFormData((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.name.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    let normalizedPhone = formData.phone;
    const localPhoneRegex = /^03[0-4][0-9]{8}$/;
    const internationalPhoneRegex = /^\+923[0-4][0-9]{8}$/;
    if (localPhoneRegex.test(normalizedPhone)) {
      normalizedPhone = "+92" + normalizedPhone.slice(1);
    } else if (!internationalPhoneRegex.test(normalizedPhone)) {
      toast.error("Please enter a valid Pakistani phone number (e.g., 03134432915)");
      return;
    }

    const cleanedAddresses = formData.addresses
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);
    if (cleanedAddresses.length > 0) {
      for (const addr of cleanedAddresses) {
        if (addr.length < 5) {
          toast.error("Each address must be at least 5 characters");
          return;
        }
      }
    }

    const loadingToast = toast.loading("Creating your account...");
    try {
      const payload = {
        ...formData,
        phone: normalizedPhone,
        addresses: cleanedAddresses,
      };
      const res = await signup(payload);
      login(res.data.token, res.data.user);
      
      toast.update(loadingToast, {
        render: "Welcome aboard! Your account has been created! 🎉",
        type: "success",
        isLoading: false,
        autoClose: 2000
      });
      
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      toast.update(loadingToast, {
        render: err.response?.data?.message || "Something went wrong during signup",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  return (
    <div className="auth-container">
      <h1>Signup</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Name"
          required
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
          />
          <span
            className="password-toggle"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
          </span>
        </div>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone (e.g., 03134432915)"
          pattern="(\+923[0-4][0-9]{8}|03[0-4][0-9]{8})"
          required
        />
        <div className="addresses-section">
          <h3>Addresses (Optional)</h3>
          {formData.addresses.map((address, index) => (
            <div key={index} className="address-input">
              <input
                type="text"
                name={`address_${index}`}
                value={address}
                onChange={handleChange}
                placeholder={`Address ${index + 1}`}
              />
              {formData.addresses.length > 1 && (
                <button
                  type="button"
                  className="remove-address-btn"
                  onClick={() => removeAddressField(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="add-address-btn"
            onClick={addAddressField}
          >
            Add Another Address
          </button>
        </div>
        <button type="submit">Signup</button>
      </form>
    </div>
  );
}

export default Signup;
