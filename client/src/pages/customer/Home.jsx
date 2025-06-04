import React from 'react';
import { Link } from "react-router-dom";
import HeroSlider from "../../components/HeroSlider";
import FeaturedCategories from "../../components/FeaturedCategories";
import PopularItems from "../../components/PopularItems";
import ReviewSlider from '../../components/ReviewSlider';
import HowItWorks from '../../components/HowItWorks';
import DownloadApp from '../../components/DownloadApp';
import "../../assets/Home.css";

function Home() {
  return (
    <div className="home-container">
      <div className="hero-section">
        <HeroSlider />
        <div className="hero-overlay">
          <h1>Welcome to EatsOnline</h1>
          <p>Order your favorite food online with ease!</p>
          <Link to="/restaurants">
            <button className="explore-btn">Explore Restaurants</button>
          </Link>
        </div>
      </div>
      <HowItWorks />
      <FeaturedCategories />
      <PopularItems />
      <ReviewSlider />
      <DownloadApp />
    </div>
  );
}

export default Home;
