import { useState, useEffect } from 'react'
import './App.css'
import "./LightenTheWorld.css";

const NAV_LINKS = ["How It Works", "About Us"];

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    setTimeout(() => setVisible(true), 100);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  return (
    <>
      <div className='main_page'>

        {/* Header */}
        <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <span className='header_title'>Lighten The World</span>
        <div className='header_links'>
          {NAV_LINKS.map((l) => (
            <button key={l}>{l}</button>
          ))}
          <button>Login</button>
          <button>Sign Up</button>
        </div>
        </nav>
        
        <div style={{ height: '200vh', background: 'linear-gradient(to bottom, #f0f0f0, #ccc)' }}>
            <h1>Scroll down to see the magic!</h1>
        </div>

        {/* Banner */}


      </div>
    </>
  )
}

export default App
