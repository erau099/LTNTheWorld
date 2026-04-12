import './App.css'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import HowItWorks from "./HowItWorks"
import Login from "./Login.jsx"
import Signup from "./Signup.jsx"
import UploadFoodDetails from "./food-upload/UploadFoodDetails.jsx"
import Home from "./Home.jsx"

function App() {
  return (
    <>
      <div className='main_page'>

        {/* Header */}
        <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <span className='header_title'>Lighten The World</span>
        <div className='header_links'>

          {/* To Navigate to the How It Works Page */}
          {NAV_LINKS.map((l) => (
            <button
              key={l}
              className='headerbtn'
              onClick={() => {
                if (l === "How It Works") {
                  setCurrentPage("how");
                }
              }}
            >
              {l}
            </button>
          ))}

          
          <button className='loginbtn' onClick={() => setCurrentPage("login")}>Login</button>
          <button className='signupbtn' onClick={() => setCurrentPage("signup")}>Sign Up</button>
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
