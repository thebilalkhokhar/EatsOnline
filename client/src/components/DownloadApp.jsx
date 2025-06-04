import React from 'react';
import { FaApple, FaGooglePlay } from 'react-icons/fa';
import './DownloadApp.css';

const benefits = [
  'Order food on the go, anytime',
  'Exclusive app-only deals',
  'Track your order live',
  'Faster checkout and reordering',
];

const DownloadApp = () => (
  <section className="download-app-section">
    <div className="download-app-content">
      <div className="download-app-info">
        <h2 className="download-app-title">Get the EatsOnline App</h2>
        <p className="download-app-desc">
          Enjoy a seamless food ordering experience on your mobile. Download our app for exclusive offers and lightning-fast ordering!
        </p>
        <div className="download-app-buttons">
          <a href="#" className="app-store-btn apple" aria-label="Download on the App Store">
            <FaApple className="store-icon" />
            <span>App Store</span>
          </a>
          <a href="#" className="app-store-btn google" aria-label="Get it on Google Play">
            <FaGooglePlay className="store-icon" />
            <span>Google Play</span>
          </a>
        </div>
        <ul className="download-app-benefits">
          {benefits.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>
      <div className="download-app-image">
        <img src="https://img.freepik.com/free-vector/realistic-smartphone-mockup-design_23-2148425643.jpg?w=740" alt="EatsOnline Mobile App" style={{ width: '220px', maxWidth: '100%', borderRadius: '2.5rem', background: '#fff0ea' }} />
      </div>
    </div>
  </section>
);

export default DownloadApp;