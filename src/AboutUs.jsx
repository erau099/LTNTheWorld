import './About.css';
 
function About() {
  return (
    <div className="about-page">
      <nav className="nav">
        <div className="nav-logo">Lighten The World</div>
        <div className="nav-links">
          <a href="#">Home</a>
          <a href="#">How It Works</a>
          <a href="#">Login</a>
          <button className="nav-btn">Sign Up</button>
        </div>
      </nav>
 
      <section className="section">
        <div className="text">
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
        <div className="circle"></div>
      </section>
 
      <section className="section reverse">
        <div className="text">
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
        <div className="circle"></div>
      </section>
 
      <footer className="footer">
        <span>Contact Us:</span>
        <span>jjobs@gmail.com</span>
      </footer>
    </div>
  );
}
 
export default About;