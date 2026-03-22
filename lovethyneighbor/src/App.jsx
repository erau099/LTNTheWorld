import { useState, useEffect } from 'react'
import './App.css'
import "./LightenTheWorld.css";

const NAV_LINKS = ["How It Works", "About Us"];

const steps = [
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <path d="M24 4C13 4 4 13 4 24s9 20 20 20 20-9 20-20S35 4 24 4z" fill="#d4edda" />
        <path d="M16 24h16M24 16v16" stroke="#2d7a3a" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    title: "Post Extra Food",
    desc: "List your extra food for others",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <circle cx="20" cy="20" r="13" stroke="#2d7a3a" strokeWidth="3" fill="#d4edda" />
        <path d="M30 30l10 10" stroke="#2d7a3a" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    title: "Find Food Nearby",
    desc: "Search and claim available food",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <path d="M24 8C17.4 8 12 13.4 12 20c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z"
        fill="#d4edda" stroke="#2d7a3a" strokeWidth="2" strokeLinejoin="round"/>
        <circle cx="24" cy="20" r="4" fill="#2d7a3a" />
      </svg>
    ),
    title: "Pick up & Enjoy",
    desc: "Meet up and pick up food",
  },
];


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

        {/* How It Works */}
        <section className='hiw'>
          <h2 className='hiwtitle'>How It Works</h2>
          <div className='steps'>
            {steps.map((s, i) => (
              <div className="step_card" key={s.title}>
                <div className="step_icon">{s.icon}</div>
                <p className="step_number">Step {i + 1}</p>
                <div className="divider" />
                <p className="steps_title">{s.title}</p>
                <p className="steps_desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
        
      </div>
    </>
  )
}

export default App
