import "./HowItWorks.css";
import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import groceriesHero from "./assets/groceries-2-2.png";
import { useAuth } from "./context/AuthContext";

// Set to true to show the Archive menu, or false to hide/disable it
const SHOW_ARCHIVE = true;

function HowItWorks() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="main_page how_page">
      {/* HEADER synced with Home.jsx */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <span className="header_title">Love Thy Neighbor</span>

        <div className="header_links">
          <Link to="/">
            <button className="headerbtn">Home</button>
          </Link>
          
          <Link to="/about">
            <button className="headerbtn">About Us</button>
          </Link>

          {/* Archive Dropdown */}
          {SHOW_ARCHIVE && (
            <div
              className="archive_container"
              style={{ position: 'relative', display: 'inline-block' }}
              onMouseLeave={() => setArchiveOpen(false)}
            >
              <button
                type="button"
                className="headerbtn"
                onClick={() => setArchiveOpen(prev => !prev)}
              >
                Archive ▾
              </button>

              {archiveOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '8px 0',
                    minWidth: '200px',
                    zIndex: 9999
                  }}
                >
                  <Link to="/donor-profile" style={{ padding: '8px 16px', color: '#333', textDecoration: 'none' }} onClick={() => setArchiveOpen(false)}>Donor Profile</Link>
                  <Link to="/receiver-profile" style={{ padding: '8px 16px', color: '#333', textDecoration: 'none' }} onClick={() => setArchiveOpen(false)}>Receiver Profile</Link>
                  <Link to="/recipient-past-orders" style={{ padding: '8px 16px', color: '#333', textDecoration: 'none' }} onClick={() => setArchiveOpen(false)}>Orders</Link>
                  <Link to="/donor-past-listings" style={{ padding: '8px 16px', color: '#333', textDecoration: 'none' }} onClick={() => setArchiveOpen(false)}>Listings</Link>
                  <Link to="/reviews" style={{ padding: '8px 16px', color: '#333', textDecoration: 'none' }} onClick={() => setArchiveOpen(false)}>Reviews</Link>
                  <Link to="/recipient-dashboard" style={{ padding: '8px 16px', color: '#333', textDecoration: 'none' }} onClick={() => setArchiveOpen(false)}>Recipient Dashboard</Link>
                  <Link to="/donor-dashboard" style={{ padding: '8px 16px', color: '#333', textDecoration: 'none' }} onClick={() => setArchiveOpen(false)}>Donor Dashboard</Link>
                </div>
              )}
            </div>
          )}

          {/* Auth Display */}
          {user ? (
            <>
              <span className="user_greeting" style={{ color: 'white', marginRight: '10px' }}>
                Hi, {user.name}
              </span>
              <button className="loginbtn" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/Login">
                <button className="loginbtn">Login</button>
              </Link>
              <Link to="/Signup">
                <button className="signupbtn">Sign Up</button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO BANNER with original image */}
      <section className="banner how_banner">
        <div
          className="banner_bg loaded how_banner_bg"
          style={{ backgroundImage: `url(${groceriesHero})` }}
        />
        <div className="banner_overlay how_banner_overlay">
          <div className="how_banner_center">
            <h1 className="banner_title">How It Works</h1>
            <p className="how_banner_subtitle">
              Simple, direct, and community-driven food sharing in three steps.
            </p>
          </div>
        </div>
      </section>

      {/* 3 STEPS CARDS */}
      <section className="how_steps_container">
        <div className="how_steps_grid">
          
          <div className="how_card">
            <div className="how_card_top">
              <span className="how_step_badge">Step 1</span>
              <h3 className="how_step_heading">Register for An Account</h3>
              <div className="how_heading_line" />
            </div>
            <p className="how_step_text">
              Create an account to begin using Love Thy Neighbor. This allows you to
              safely participate in sharing or receiving food within your community.
              Provide basic information such as your email and phone number for verification,
              and agree to community guidelines to get started.
            </p>
          </div>

          <div className="how_card how_card_featured">
            <div className="how_card_top">
              <span className="how_step_badge badge_light">Step 2</span>
              <h3 className="how_step_heading">Post Or Browse Food</h3>
              <div className="how_heading_line" />
            </div>
            <p className="how_step_text">
              Donors can post extra groceries, meals, or pantry items with details on
              pickup time, location, and allergens. Recipients can browse live listings
              nearby and submit a request with just one click to keep good food from going to waste.
            </p>
          </div>

          <div className="how_card">
            <div className="how_card_top">
              <span className="how_step_badge">Step 3</span>
              <h3 className="how_step_heading">Coordinate & Pick Up</h3>
              <div className="how_heading_line" />
            </div>
            <p className="how_step_text">
              Once an item is claimed and approved, both parties coordinate within the scheduled
              pickup window. Meet at the designated location for a safe handoff, mark the order
              complete, and leave a review to build community trust.
            </p>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="how_footer">
        <span>Love Thy Neighbor © 2026</span>
        <span>Questions? Contact us at <a href="mailto:support@lovethyneighbor.org">support@lovethyneighbor.org</a></span>
      </footer>
    </div>
  );
}

export default HowItWorks;