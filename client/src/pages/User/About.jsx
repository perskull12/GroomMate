import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-container">
      {/* Mission Section */}
      <section className="mission-section">
        <div className="mission-content">
          <h1>About Groommate</h1>
          <h2>Your Personal Grooming Companion</h2>
          <p>
            At Groommate, we're revolutionizing men's grooming by blending traditional 
            barbering expertise with modern convenience. Our mission is to provide 
            premium, accessible grooming services tailored to your lifestyle.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Why Choose Us</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <img src='client\src\assets\expert.jpg' alt='Clipper'/>  
            </div>
            <h3>Expert Barbers</h3>
            <p>Certified professionals with years of experience in men's grooming.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <img src='' alt='⏱' />
            </div>
            <h3>Quick Service</h3>
            <p>Quality grooming in less time with our efficient booking system.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <img src='client\src\assets\clock.webp' alt='Premier'/>
            </div>
            <h3>Premium Products</h3>
            <p>We use only the highest quality grooming products available.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;