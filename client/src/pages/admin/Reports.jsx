import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FaArrowLeft } from "react-icons/fa";
import { getSalesReport, getRestaurantDetails } from "../../services/api";
import generatePDF from "../../utils/generatePDF";
import "../../assets/AdminCommon.css";
import "../../assets/AdminReports.css";

function Reports() {
  const [report, setReport] = useState({
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    salesByPeriod: [],
    topProducts: [],
  });
  const [restaurantDetails, setRestaurantDetails] = useState({
    restaurantName: "Unknown Restaurant",
    contactNumber: "+92-333-1234567",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("daily");
  const { token, user } = useContext(AuthContext);
  console.log("User object:", user); // Debug log
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch Sales Report
        const salesRes = await getSalesReport({ period });
        console.log("Sales report response:", salesRes.data);
        setReport({
          totalSales: salesRes.data.data.totalSales || 0,
          totalOrders: salesRes.data.data.totalOrders || 0,
          avgOrderValue: salesRes.data.data.avgOrderValue || 0,
          salesByPeriod: salesRes.data.data.salesByPeriod || [],
          topProducts: salesRes.data.data.topProducts || [],
        });

        // Fetch Restaurant Details
        if (user.restaurantId) {
          const restaurantRes = await getRestaurantDetails(user.restaurantId);
          console.log("Restaurant details response:", restaurantRes);
          setRestaurantDetails({
            restaurantName: restaurantRes.data.name || "Unknown Restaurant",
            contactNumber:
              restaurantRes.data.contact.phone ||
              user.phone ||
              "+92-333-1234567",
          });
        }
      } catch (err) {
        console.error("Error:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, period, user.restaurantId]);

  // Function to handle PDF download with period and restaurant details
  const handleDownloadPDF = () => {
    console.log("Download PDF triggered with report:", report);
    console.log("Restaurant details:", restaurantDetails);
    generatePDF(report, period, restaurantDetails);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-reports-container">
      <div className="button-row">
        <button className="back-btn" onClick={() => navigate("/admin/dashboard")}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        <button
          className="download-btn"
          onClick={handleDownloadPDF}
          disabled={loading}
        >
          Download PDF
        </button>
      </div>
      <h1>Sales Reports</h1>

      <div className="filter-section">
        <label>View by:</label>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Sales</h3>
          <p>PKR {report.totalSales.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p>{report.totalOrders}</p>
        </div>
        <div className="stat-card">
          <h3>Avg. Order Value</h3>
          <p>PKR {report.avgOrderValue.toFixed(2)}</p>
        </div>
      </div>

      <div className="sales-period">
        <h2>Sales by {period.charAt(0).toUpperCase() + period.slice(1)}</h2>
        <div className="period-table">
          <div className="table-header">
            <span>Period</span>
            <span>Sales</span>
            <span>Orders</span>
          </div>
          {report.salesByPeriod.length === 0 ? (
            <p>No data available</p>
          ) : (
            report.salesByPeriod.map((item, index) => (
              <div key={index} className="table-row">
                <span>{item.period}</span>
                <span>PKR {item.sales.toFixed(2)}</span>
                <span>{item.orders}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="top-products">
        <h2>Top Selling Products</h2>
        <div className="products-table">
          <div className="table-header">
            <span>Product</span>
            <span>Sales</span>
            <span>Units Sold</span>
          </div>
          {report.topProducts.length === 0 ? (
            <p>No data available</p>
          ) : (
            report.topProducts.map((product) => (
              <div key={product._id} className="table-row">
                <span>{product.name}</span>
                <span>PKR {product.totalSales.toFixed(2)}</span>
                <span>{product.unitsSold}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
