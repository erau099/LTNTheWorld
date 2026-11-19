import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AboutUs.css';
import { useAuth } from './context/AuthContext';

// Set to true to show the Archive menu, or false to hide/disable it
const SHOW_ARCHIVE = true;

function About() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="about-page">
      {/* Header synced with Home.jsx */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <span className="header_title">Love Thy Neighbor</span>

        <div className="header_links">
          <Link to="/">
            <button className="headerbtn">Home</button>
          </Link>
          <Link to="/HowItWorks">
            <button className="headerbtn">How It Works</button>
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

          {/* Auth Controls */}
          {user ? (
            <>
              <span className="user_greeting" style={{ color: 'white', marginRight: '10px' }}>
                Hi, {user.name}
              </span>
              <button className="loginbtn" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/Login"><button className="loginbtn">Login</button></Link>
              <Link to="/Signup"><button className="signupbtn">Sign Up</button></Link>
            </>
          )}
        </div>
      </nav>

      {/* Page Header Hero */}
      <header className="about-hero">
        <h1 className="about-hero-title">About Us</h1>
        <p className="about-hero-subtitle">Connecting communities, reducing food waste, and helping neighbors.</p>
      </header>

      {/* Main Content Sections */}
      <main className="about-content">
        <section className="about-section">
          <div className="about-text">
            <h2>Our Story</h2>
            <div className="divider" />
            <p>
              Love Thy Neighbor began with a simple belief: no good food should go to waste
              while someone in our community is in need. We built this platform to make sharing
              excess groceries and meals seamless, transparent, and direct between neighbors.
            </p>
          </div>
          {/* Rectangular Photo Placeholder 1 */}
          <div className="about-image-placeholder">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#2d7a3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="placeholder-label">Our Community In Action</span>
          </div>
        </section>

        <section className="about-section about-reverse">
          <div className="about-text">
            <h2>Our Goal</h2>
            <div className="divider" />
            <p>
              Our mission is to foster local support systems through everyday food sharing.
              Whether you are a donor with garden produce or excess pantry items, or a neighbor
              seeking a meal, we are dedicated to keeping pickups safe, fair, and welcoming for everyone.
            </p>
          </div>
          {/* Rectangular Photo Placeholder 2 */}
          <div className="about-image-placeholder">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#2d7a3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="placeholder-label">Shared Mission & Impact</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="about-footer">
        <span>Love Thy Neighbor © 2026</span>
        <span>Contact: <a href="mailto:support@lovethyneighbor.org">support@lovethyneighbor.org</a></span>
      </footer>
    </div>
  );
}

export default About;