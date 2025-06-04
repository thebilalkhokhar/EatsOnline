import React, { useState, useEffect, useContext } from 'react';
import { FaStar, FaStarHalf, FaShoppingCart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getProducts, updateCart } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import styles from '../assets/PopularItems.module.css';

const RatingStars = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className={styles['rating-stars']}>
      {[...Array(fullStars)].map((_, index) => (
        <FaStar key={`star-${index}`} className={`${styles['star-icon']} ${styles.filled}`} />
      ))}
      {hasHalfStar && <FaStarHalf className={`${styles['star-icon']} ${styles.filled}`} />}
      {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, index) => (
        <FaStar key={`empty-star-${index}`} className={styles['star-icon']} />
      ))}
    </div>
  );
};

const PopularItems = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching products...");
        
        const response = await getProducts();
        console.log("Raw API response:", response);

        if (!response || !response.data) {
          throw new Error('No data received from API');
        }

        if (!Array.isArray(response.data)) {
          console.error("Unexpected data format:", response.data);
          throw new Error('Invalid data format received');
        }

        // Filter out products without required fields and sort by rating
        const validProducts = response.data
          .filter(product => {
            if (!product || !product.name || !product.price) {
              console.log("Skipping invalid product:", product);
              return false;
            }
            return true;
          })
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 4);

        console.log("Processed products:", validProducts);
        
        if (validProducts.length === 0) {
          throw new Error('No valid products found');
        }

        setProducts(validProducts);
      } catch (err) {
        console.error("Error details:", err);
        setError(err.response?.data?.message || err.message || 'Failed to load popular dishes');
        toast.error('Failed to load popular dishes');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (item) => {
    try {
      if (!user) {
        toast.warning('Please login to add items to cart');
        return;
      }

      await updateCart({
        productId: item._id,
        quantity: 1,
        action: 'add'
      });

      toast.success(`${item.name} added to cart!`);
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.error(err.response?.data?.message || 'Failed to add item to cart');
    }
  };

  if (loading) {
    return (
      <section className={styles['popular-items']}>
        <div className={styles['popular-items-container']}>
          <h2>Popular Dishes</h2>
          <p className={styles['section-description']}>Loading popular dishes...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles['popular-items']}>
        <div className={styles['popular-items-container']}>
          <h2>Popular Dishes</h2>
          <p className={styles['section-description']} style={{ color: 'red' }}>{error}</p>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className={styles['popular-items']}>
        <div className={styles['popular-items-container']}>
          <h2>Popular Dishes</h2>
          <p className={styles['section-description']}>No dishes available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles['popular-items']}>
      <div className={styles['popular-items-container']}>
        <h2>Popular Dishes</h2>
        <p className={styles['section-description']}>Our most loved dishes from all restaurants</p>
        
        <div className={styles['items-grid']}>
          {products.map((item) => (
            <div key={item._id} className={styles['item-card']}>
              <div className={styles['item-image-container']}>
                <img 
                  src={item.image?.url || 'https://via.placeholder.com/300x200?text=No+Image'} 
                  alt={item.name} 
                  className={styles['popular-item-card-image']} 
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
              </div>
              <div className={styles['item-details']}>
                <h3 className={styles['item-name']}>{item.name}</h3>
                <p className={styles['item-description']}>{item.description || 'No description available'}</p>
                {/* Only show rating if available and reviews > 0 */}
                {(typeof item.rating === 'number' && item.rating > 0 && item.reviews > 0) && (
                  <div className={styles['item-rating']}>
                    <RatingStars rating={item.rating} />
                    <span className={styles['rating-number']}>
                      {item.rating.toFixed(1)} ({item.reviews})
                    </span>
                  </div>
                )}
                <div className={styles['item-footer']}>
                  <span className={styles['item-price']}>Rs. {item.price}</span>
                  <button 
                    className={styles['add-to-cart-btn']}
                    onClick={() => handleAddToCart(item)}
                  >
                    <FaShoppingCart className={styles['cart-icon']} />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularItems; 