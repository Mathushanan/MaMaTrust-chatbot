import React from "react";
import { Link } from "react-router-dom";
import { FiMessageCircle, FiHeart, FiShield, FiClock } from "react-icons/fi";
import momBaby from "../assets/images/mom-baby.png";

const Home = ({ user }) => {
  // Logged-in home page
  if (user) {
    return (
      <div className="home-page">
        <div className="home-header">
          <div>
            <h3>Welcome back, {user.name}! 👋</h3>
            <p>How can MamaTrust help you today?</p>
          </div>

          <Link to="/chat" className="chat-button">
            <FiMessageCircle />
            Start Chat
          </Link>
        </div>

        <div className="home-content">
          <div className="welcome-card">
            <div className="welcome-title">
              <div className="welcome-icon">
                <FiHeart />
              </div>

              <div>
                <h3>Your parenting assistant</h3>
                <p>Here to support your feeding journey</p>
              </div>
            </div>

            <p className="welcome-description">
              Ask MamaTrust anything about feeding, nutrition, introducing
              solids, allergies, picky eating, and more.
            </p>

            <Link to="/chat" className="primary-button">
              <FiMessageCircle />
              Chat with MamaTrust
            </Link>
          </div>

          <div className="info-card">
            <h3>What can I ask?</h3>

            <div className="question-item">
              <span>🥣</span>
              <p>What foods are suitable for my baby's age?</p>
            </div>

            <div className="question-item">
              <span>🥛</span>
              <p>How much formula should my baby have?</p>
            </div>

            <div className="question-item">
              <span>🥜</span>
              <p>How should I introduce common allergens?</p>
            </div>

            <div className="question-item">
              <span>🍎</span>
              <p>What are some healthy meal ideas?</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged-out home page
  return (
    <div className="home-page">
      <section className="hero-section ">
        <div className="row align-items-center">
          {/* LEFT SIDE - 70% TEXT */}
          <div className="col-md-8 hero-content ">
            <span className="hero-badge">AI Parenting Assistant</span>

            <h2>
              Supporting you through
              <br />
              every feeding journey.
            </h2>

            <p>
              MamaTrust provides simple and reliable information about child
              feeding and nutrition, helping parents and caregivers make
              informed decisions for their little ones.
            </p>

            <Link to="/login" className="primary-button">
              Get Started
            </Link>
          </div>

          {/* RIGHT SIDE - IMAGE */}
          <div className="col-md-4 hero-image ">
            <img src={momBaby} alt="Mother and baby" className="img-fluid" />
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>How MamaTrust can help</h2>

        <div className="features-grid">
          <div className="feature-card text-center">
            <div className="feature-icon">
              <FiMessageCircle />
            </div>

            <h4>Ask Questions</h4>

            <p>
              Get quick answers to your child feeding and nutrition questions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiHeart />
            </div>
            <h4>Age Appropriate</h4>
            <p>Receive guidance based on your child's age and feeding stage.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiShield />
            </div>
            <h4>Trusted Guidance</h4>
            <p>
              Get helpful information designed to support informed feeding
              decisions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiClock />
            </div>
            <h4>Available Anytime</h4>
            <p>Access whenever you need help during your parenting journey.</p>
          </div>
        </div>
      </section>

      <section className="disclaimer-section">
        <p>
          MamaTrust provides general feeding and nutrition information. For
          medical concerns or emergencies, always consult a qualified healthcare
          professional.
        </p>
      </section>
    </div>
  );
};

export default Home;
