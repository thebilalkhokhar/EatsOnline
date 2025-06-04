import React from 'react';
import { FaUtensils, FaListAlt, FaCreditCard, FaBoxOpen } from 'react-icons/fa';
import './HowItWorks.css';

const steps = [
  {
    icon: <FaUtensils className="hiw-icon" />, 
    title: 'Browse Restaurants',
    desc: 'Explore a variety of restaurants and cuisines near you.'
  },
  {
    icon: <FaListAlt className="hiw-icon" />, 
    title: 'Choose Your Dishes',
    desc: 'Select your favorite meals and customize your order.'
  },
  {
    icon: <FaCreditCard className="hiw-icon" />, 
    title: 'Easy Payment',
    desc: 'Pay securely online or choose cash on delivery.'
  },
  {
    icon: <FaBoxOpen className="hiw-icon" />, 
    title: 'Enjoy Fast Delivery',
    desc: 'Sit back and relax while your food is delivered to your door.'
  },
];

const HowItWorks = () => (
  <section className="how-it-works-section">
    <h2 className="hiw-title">How It Works</h2>
    <div className="hiw-steps">
      {steps.map((step, idx) => (
        <div className="hiw-step" key={idx} style={{ animationDelay: `${idx * 0.2}s` }}>
          <div className="hiw-icon-wrapper">{step.icon}</div>
          <h3 className="hiw-step-title">{step.title}</h3>
          <p className="hiw-step-desc">{step.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

export default HowItWorks; 