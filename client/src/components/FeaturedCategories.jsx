import React from 'react';
import { Link } from 'react-router-dom';
import { FaPizzaSlice, FaHamburger, FaIceCream, FaDrumstickBite, FaFish, FaCarrot } from 'react-icons/fa';
import { GiNoodles, GiCoffeeCup } from 'react-icons/gi';
import '../assets/FeaturedCategories.css';

const categories = [
  {
    id: 1,
    name: 'Pizza',
    icon: FaPizzaSlice,
    image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg',
    color: '#FF6B6B'
  },
  {
    id: 2,
    name: 'Burgers',
    icon: FaHamburger,
    image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
    color: '#4ECDC4'
  },
  {
    id: 3,
    name: 'Desserts',
    icon: FaIceCream,
    image: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg',
    color: '#FFD93D'
  },
  {
    id: 4,
    name: 'Chicken',
    icon: FaDrumstickBite,
    image: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg',
    color: '#FF8B8B'
  },
  {
    id: 5,
    name: 'Seafood',
    icon: FaFish,
    image: 'https://images.pexels.com/photos/3296280/pexels-photo-3296280.jpeg',
    color: '#6C5CE7'
  },
  {
    id: 6,
    name: 'Vegetarian',
    icon: FaCarrot,
    image: 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg',
    color: '#A8E6CF'
  },
  {
    id: 7,
    name: 'Asian',
    icon: GiNoodles,
    image: 'https://images.pexels.com/photos/1731535/pexels-photo-1731535.jpeg',
    color: '#FF9A8B'
  },
  {
    id: 8,
    name: 'Beverages',
    icon: GiCoffeeCup,
    image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg',
    color: '#B088F9'
  }
];

const FeaturedCategories = () => {
  return (
    <section className="featured-categories">
      <div className="featured-categories-container">
        <h2>Explore Food Categories</h2>
        <p className="section-description">Discover your favorite dishes across various cuisines</p>
        <div className="categories-grid">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Link 
                to={`/menu?category=${category.name.toLowerCase()}`} 
                key={category.id} 
                className="category-card"
                style={{
                  '--category-color': category.color,
                  backgroundImage: `url(${category.image})`
                }}
              >
                <div className="category-overlay">
                  <IconComponent className="category-icon" />
                  <h3>{category.name}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories; 