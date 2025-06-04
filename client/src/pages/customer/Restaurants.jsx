import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRestaurants } from "../../services/api";
import { FaMotorcycle, FaMapMarkerAlt, FaUtensils } from "react-icons/fa";
import styles from "../../assets/Restaurants.module.css";

function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await getRestaurants();
        console.log("Restaurant Data:", res.data);
        setRestaurants(res.data || []);
      } catch (err) {
        console.error("Fetch restaurants error:", err);
        setError(err.response?.data?.message || "Failed to load restaurants");
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const handleRestaurantClick = (restaurantId) => {
    navigate(`/menu/${restaurantId}`);
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Our Partner Restaurants</h1>
      </header>
      <div className={styles.restaurantsGrid}>
        {restaurants.length === 0 ? (
          <p className={styles.noRestaurants}>No restaurants available</p>
        ) : (
          restaurants.map((restaurant) => (
            <div
              key={restaurant._id}
              className={styles.card}
              onClick={() => handleRestaurantClick(restaurant._id)}
            >
              <div className={styles.imageContainer}>
                <img
                  src={restaurant.logo?.url || "https://via.placeholder.com/400x200?text=Restaurant"}
                  alt={restaurant.name}
                  className={styles.image}
                  onError={(e) => {
                    console.log("Image failed to load:", e.target.src);
                    e.target.src = "https://via.placeholder.com/400x200?text=Restaurant";
                  }}
                />
              </div>
              <h3 className={styles.name}>{restaurant.name}</h3>
              <div className={styles.location}>
                <FaMapMarkerAlt />
                <span>
                  {restaurant.address?.city && restaurant.address?.country 
                    ? `${restaurant.address.city}, ${restaurant.address.country}`
                    : "Location not available"}
                </span>
              </div>
              <div className={styles.cuisine}>
                <FaUtensils />
                <span>
                  {Array.isArray(restaurant.cuisineType) 
                    ? restaurant.cuisineType.join(", ")
                    : restaurant.cuisineType || "Various Cuisines"}
                </span>
              </div>
              {restaurant.description && (
                <p className={styles.description}>
                  {restaurant.description.length > 100
                    ? restaurant.description.slice(0, 100) + '...'
                    : restaurant.description}
                </p>
              )}
              {restaurant.deliveryAvailable && (
                <div className={styles.deliveryBadge}>
                  <FaMotorcycle /> Delivery Available
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Restaurants; 