import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { login } from "../../services/api";
import { toast } from "react-toastify";
import "../../assets/Auth.css";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { login: setAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const loadingToast = toast.loading("Logging in...");
    try {
      const res = await login(formData);
      console.log('Login response:', res.data); // Debug log
      setAuth(res.data.token, res.data.user);
      
      toast.update(loadingToast, {
        render: "Login successful! Welcome back! 🎉",
        type: "success",
        isLoading: false,
        autoClose: 2000
      });
      
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      toast.update(loadingToast, {
        render: err.response?.data?.message || "Something went wrong during login",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  return (
    <div className="auth-container">
      <h1>Login</h1>
      <form onSubmit={handleSubmit} className="auth-form">
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
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
