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
            <button key={l} className='headerbtn'>{l}</button>
          ))}
          <button className='loginbtn'>Login</button>
          <button className='signupbtn'>Sign Up</button>
        </div>
        </nav>

        {/* Banner */}
        <section className='banner'>
          <div className={`banner_bg ${visible ? "loaded" : ""}`}/>
          <div className='banner_overlay'>
          <div className={`banner_content ${visible ? "visible" : ""}`}>
            <h1 className='banner_title'>
              Share Extra Food<br/>
              Help Your Community
            </h1>
            <div className='bannerbtn'>
              <button className='btn1'>Find Food Near Me</button>
              <button className='btn2'>Post Your Extra Food</button>
            </div>
          </div>
          </div>
        </section>
        
        <div style={{ height: '200vh', background: 'linear-gradient(to bottom, #f0f0f0, #ccc)' }}>
            <h1>Scroll down to see the magic!</h1>
        </div>


      </div>
    </>
  )
}

export default App
