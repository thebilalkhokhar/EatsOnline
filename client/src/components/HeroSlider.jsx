import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../assets/HeroSlider.css';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const slides = [
    {
      id: 1,
      image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
      // title: 'Delicious Food Delivered',
      // description: 'Order your favorite meals from the best restaurants in town',
      // buttonText: 'Order Now',
      // buttonLink: '/restaurants'
    },
    {
      id: 2,
      image: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg',
      // title: 'Special Offers',
      // description: 'Get amazing deals on your favorite restaurants',
      // buttonText: 'View Offers',
      // buttonLink: '/offers'
    },
    {
      id: 3,
      image: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg',
      // title: 'Fast Delivery',
      // description: 'Quick and reliable delivery to your doorstep',
      // buttonText: 'Learn More',
      // buttonLink: '/about'
    }
  ];

  const nextSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const prevSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const goToSlide = (index) => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentSlide(index);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hero-slider">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`slide ${index === currentSlide ? 'active' : ''} ${
            index === (currentSlide - 1 + slides.length) % slides.length ? 'prev' : ''
          }`}
        >
          <div className="slide-overlay"></div>
          <img src={slide.image} alt={slide.title} />
          <div className="slide-content">
            <h2>{slide.title}</h2>
            <p>{slide.description}</p>
            {/* <Link to={slide.buttonLink}>
              <button>{slide.buttonText}</button>
            </Link> */}
          </div>
        </div>
      ))}

      <div className="slider-nav">
        <button className="prev-btn" onClick={prevSlide}>
          ←
        </button>
        <button className="next-btn" onClick={nextSlide}>
          →
        </button>
      </div>

      <div className="slider-dots">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider; 