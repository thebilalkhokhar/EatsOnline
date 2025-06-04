import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import '../assets/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>About EatsOnline</h3>
          <p>Your favorite food delivery platform bringing delicious meals right to your doorstep. We connect you with the best restaurants in town.</p>
          <div className="social-links">
            <a href="#" className="social-link"><FaFacebookF /></a>
            <a href="#" className="social-link"><FaTwitter /></a>
            <a href="#" className="social-link"><FaInstagram /></a>
            <a href="#" className="social-link"><FaLinkedinIn /></a>
          </div>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/restaurants">Restaurants</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms & Conditions</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact Info</h3>
          <ul className="contact-info">
            <li>
              <FaPhoneAlt className="contact-icon" />
              <span>+92 313 443 2915</span>
            </li>
            <li>
              <FaEnvelope className="contact-icon" />
              <span>support@eatsonline.com</span>
            </li>
            <li>
              <FaMapMarkerAlt className="contact-icon" />
              <span>123 Food Street, Cuisine City, Pakistan</span>
            </li>
            <li>
              <FaClock className="contact-icon" />
              <span>Open: 10:00 AM - 11:00 PM</span>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Download App</h3>
          <p>Get our mobile app for a better experience</p>
          <div className="app-buttons">
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on App Store" />
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; {new Date().getFullYear()} EatsOnline. All rights reserved.</p>
          <p>Designed with ❤️ by Bilal</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 