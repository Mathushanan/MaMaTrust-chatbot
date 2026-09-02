import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiUserPlus } from "react-icons/fi";

const Signup = ({ setUser }) => {
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Check passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    /*
 

    try {
      const response = await axios.post(
        "/api/signup",
        formData
      );

      const user = response.data.user;

      localStorage.setItem(
        "token",
        response.data.token
      );

      setUser(user);

      navigate("/");

    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Something went wrong. Please try again."
      );
    }

    */

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const user = {
      name: formData.name,
      email: formData.email,
    };

    localStorage.setItem("token", "fake-signup-token");

    if (setUser) {
      setUser(user);
    }

    console.log("Signup details:", formData);

    setLoading(false);

    navigate("/login");
  };

  return (
    <div className="login-page">
      <div className="container">
        {error && <p className="text-danger text-center mb-3">{error}</p>}

        <div className="login-card row g-0">
          {/* LEFT SIDE - SIGNUP FORM */}
          <div className="col-lg-6 login-form-section">
            <div className="login-content">
              {/* Logo */}
              <div className="brand">
                <span>MaMaTrust</span>

                <div className="brand-icon">AI</div>
              </div>

              {/* Heading */}
              <div className="mb-4">
                <h1>Create account 🍼</h1>

                <p>Join & support your parenting journey!</p>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Name */}
                <div className="mb-2">
                  <div className="input-group custom-input">
                    <span className="input-group-text">
                      <FiUser />
                    </span>

                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="mb-2">
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
                <div className="mb-2">
                  <div className="input-group custom-input">
                    <span className="input-group-text">
                      <FiLock />
                    </span>

                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="mb-3">
                  <div className="input-group custom-input">
                    <span className="input-group-text">
                      <FiLock />
                    </span>

                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-control"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Signup Button */}
                <button
                  type="submit"
                  className="btn login-button w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creating account...
                    </>
                  ) : (
                    <>
                      <FiUserPlus className="me-2" />
                      Create Account
                    </>
                  )}
                </button>
              </form>

              {/* Login */}
              <p className="signup-text">
                Already have an account?
                <Link to="/login">Sign In</Link>
              </p>

              {/* Disclaimer */}
              <p className="disclaimer">
                MamaTrust provides feeding information for parents and
                caregivers. Always consult a qualified healthcare professional
                for medical concerns.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE - SAME DESIGN */}
          <div className="col-lg-6 login-image-section signup-image-section">
            <div className="image-overlay">
              <div className="image-text">
                <h2>Start your journey with MamaTrust.</h2>

                <p>
                  Get personalised feeding guidance and helpful information to
                  support you and your little one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
