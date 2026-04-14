import './AboutUs.css';
import { Link } from 'react-router-dom';

function About() {
  return (
    <div className="about-page">
      <nav className="about-nav">
        <div className="about-nav-logo">Lighten The World</div>
        <div className="about-nav-links">
          <Link to="/">Home</Link>
          <Link to="/HowItWorks">How It Works</Link>
          <Link to="/Login">Login</Link>
          <Link to="/Signup"><button className="about-nav-btn">Sign Up</button></Link>
        </div>
      </nav>

      <section className="about-section">
        <div className="about-text">
          <h2>Our Story</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
            mollit anim id est laborum.
          </p>
        </div>
        <div className="about-circle"></div>
      </section>

      <section className="about-section about-reverse">
        <div className="about-text">
          <h2>Our Goal</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
            mollit anim id est laborum.
          </p>
        </div>
        <div className="about-circle"></div>
      </section>

      <footer className="about-footer">
        <span>Contact Us:</span>
        <span>jjobs@gmail.com</span>
      </footer>
    </div>
  );
}

export default About;