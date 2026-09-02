import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiLogIn, FiMail, FiLock } from "react-icons/fi";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    // Temporary fake login
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Login details:", formData);

    alert("Demo login successful!");

    setLoading(false);
  };

  return (
    <div className="login-page ">
      <div className="container ">
        <div className="login-card row g-0 ">
          {/* LEFT SIDE - LOGIN FORM */}
          <div className="col-lg-6 login-form-section ">
            <div className="login-content">
              {/* Logo */}
              <div className="brand ">
                <span>MaMaTrust</span>
                <div className="brand-icon">AI</div>
              </div>

              {/* Heading */}
              <div className="mb-4  ">
                <h1>Welcome back! 👋</h1>
                <p>Sign in to continue your parenting journey!</p>
              </div>

              <form onSubmit={handleSubmit} className="">
                {/* Email */}
                <div className="mb-2 ">
                  <div className="input-group custom-input">
                    <span className="input-group-text">
                      <FiMail />
                    </span>

                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="mb-3">
                  <div className="input-group custom-input">
                    <span className="input-group-text">
                      <FiLock />
                    </span>

                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Login button */}
                <button
                  type="submit"
                  className="btn login-button w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <FiLogIn className="me-2" />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Signup */}
              <p className="signup-text ">
                Don't have an account?
                <Link to="/register">Create an account</Link>
              </p>

              {/* Small disclaimer */}
              <p className="disclaimer ">
                MamaTrust provides feeding information for parents and
                caregivers. Always consult a qualified healthcare professional
                for medical concerns.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE - IMAGE */}
          <div className="col-lg-6 login-image-section">
            <div className="image-overlay">
              <div className="image-text">
                <h2>
                  Supporting you through
                  <br />
                  every feeding journey.
                </h2>

                <p>
                  Get trusted feeding guidance for your little one, whenever you
                  need it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
