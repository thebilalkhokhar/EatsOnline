import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { getRestaurants, getProducts, updateCart } from "../../services/api";
import { toast } from "react-toastify";
import { FaShoppingCart } from "react-icons/fa";
import styles from "../../assets/Menu.module.css";
import RestaurantReviews from "../../components/RestaurantReviews";

function Menu() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("menu"); // 'menu' or 'reviews'
  const { token } = useContext(AuthContext);
  const { refreshCart } = useCart();
  const navigate = useNavigate();

  // Fetch restaurant and its products
  useEffect(() => {
    const fetchRestaurantAndProducts = async () => {
      if (!restaurantId) {
        navigate('/restaurants');
        return;
      }

      try {
        // Get restaurant details
        const resRestaurants = await getRestaurants();
        const foundRestaurant = resRestaurants.data.find(r => r._id === restaurantId);
        
        if (!foundRestaurant) {
          setError("Restaurant not found");
          return;
        }
        
        setRestaurant(foundRestaurant);

        // Get restaurant's products
        const resProducts = await getProducts(restaurantId);
        setProducts(resProducts.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || "Failed to load menu");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantAndProducts();
  }, [restaurantId, navigate]);

  const handleAddToCart = async (productId, productName) => {
    if (!token) {
      navigate('/login');
      return;
    }

    const loadingToast = toast.loading("Adding to cart...");
    
    try {
      const data = { productId, quantity: 1 };
      await updateCart(data, token);
      refreshCart(); // Refresh cart count
      
      toast.update(loadingToast, {
        render: `${productName} added to cart! 🛒`,
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (err) {
      toast.update(loadingToast, {
        render: err.response?.data?.message || "Failed to add to cart",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Add to cart error:", err);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!restaurant) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <button
            onClick={() => navigate('/restaurants')}
            className={styles.backBtn}
          >
            Back to Restaurants
          </button>
        </div>
        
        {/* Restaurant Details Section */}
        <div className={styles.restaurantDetails}>
          <div className={styles.restaurantHeader}>
            <div className={styles.restaurantLogo}>
              <img
                src={restaurant.logo?.url || "https://via.placeholder.com/150x150?text=Restaurant"}
                alt={restaurant.name}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/150x150?text=Restaurant";
                }}
              />
            </div>
            <div className={styles.restaurantInfo}>
              <h1>{restaurant.name}</h1>
              <div className={styles.restaurantMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Minimum Order:</span>
                  <span className={styles.metaValue}>PKR {restaurant.minimumOrderAmount || 0}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Delivery Time:</span>
                  <span className={styles.metaValue}>{restaurant.averageDeliveryTime || "30-45"} mins</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Location:</span>
                  <span className={styles.metaValue}>
                    {restaurant.address?.city && restaurant.address?.country 
                      ? `${restaurant.address.city}, ${restaurant.address.country}`
                      : "Location not available"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {restaurant.description && (
            <div className={styles.restaurantDescription}>
              <h3>About</h3>
              <p>{restaurant.description}</p>
            </div>
          )}
        </div>
        
        {/* Tabs */}
        <div className={styles.menuSection}>
          <div className={styles.menuHeader}>
            <div className={styles.menuTabs}>
              <button
                className={`${styles.menuTab} ${activeTab === 'menu' ? styles.activeMenuTab : ''}`}
                onClick={() => setActiveTab('menu')}
              >
                Menu
              </button>
              <button
                className={`${styles.menuTab} ${activeTab === 'reviews' ? styles.activeMenuTab : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews
              </button>
            </div>

            {activeTab === 'menu' && (
              <div className={styles.menuSearch}>
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className={styles.menuContent}>
            {activeTab === 'menu' ? (
              <>
                {loading ? (
                  <div className={styles.loading}>Loading menu items...</div>
                ) : error ? (
                  <div className={styles.error}>{error}</div>
                ) : filteredProducts.length === 0 ? (
                  <div className={styles.noProducts}>No menu items found.</div>
                ) : (
                  <div className={styles.menuGrid}>
                    {filteredProducts.map((product) => (
                      <div key={product._id} className={styles.menuCard}>
                        <div className={styles.menuImageContainer}>
                          <img
                            src={product.image?.url || 'https://via.placeholder.com/300x200?text=No+Image'}
                            alt={product.name}
                            className={styles.menuImage}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                            }}
                          />
                        </div>
                        <div className={styles.menuDetails}>
                          <h3 className={styles.menuName}>{product.name}</h3>
                          <p className={styles.menuCategory}>{product.category?.name || "Uncategorized"}</p>
                          <p className={styles.menuDescription}>{product.description || "No description available"}</p>
                          <div className={styles.menuMeta}>
                            <span className={styles.menuPrice}>PKR {product.price.toFixed(2)}</span>
                            <span className={styles.menuStock}>
                              {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                            </span>
                          </div>
                          <button
                            className={styles.addToCartBtn}
                            onClick={() => handleAddToCart(product._id, product.name)}
                            disabled={product.stock === 0}
                          >
                            <FaShoppingCart />
                            {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <RestaurantReviews restaurantId={restaurantId} />
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

export default Menu;
