import "./HowItWorks.css";
import { useState, useEffect } from 'react'
import { Link } from "react-router-dom";
import groceriesHero from "./assets/groceries-2-2.png";


function HowItWorks({ onGoHome }) {
    return (
    <div className="main_page">
      
      {/* HEADER (same as App.jsx, just changed button) */}
      <nav className="nav">
        <span className="header_title">Lighten The World</span>

        <div className="header_links">
          <button className="headerbtn" onClick={onGoHome}>
            Home
          </button>

          <button className="headerbtn">About Us</button>

          <button className="loginbtn">Login</button>
          <button className="signupbtn">Sign Up</button>
        </div>
      </nav>

      {/* HERO (reuse banner similar to App.jsx, just swapping image) */}
      <section className="banner how_banner">
        <div
          className="banner_bg loaded how_banner_bg"
          style={{ backgroundImage: `url(${groceriesHero})` }}
        />

        {/*<div className="banner_overlay">*/}
          <div className="how_banner_center">
            <h1 className="banner_title">How It Works</h1>
          </div>
      </section>

      {/* 3 STEPS SECTION */}
        <section className="how_steps_row">

            <div className="how_row_column how_col_light">
                <div className="how_top">
                <p className="how_step_label">Step 1</p>
                <h3 className="how_step_heading">Register for An Account</h3>
                <div className="how_heading_line"></div>
                </div>
                <p classname="how_step_text">
                    Create an account to begin using Lighten The World. This allows you to
                    safely participate in sharing or receiving food within your community.
                    During registration, you will provide basic information such as your
                    email and phone number for verification. You will also be asked to agree
                    to a liability waiver to ensure safe participation. Once completed, your
                    account will be ready to use and fully verified.
                </p>
            </div>

            <div className="how_row_column how_col_green">
                <div className="how_top">              
                <p className= "how_step_label">Step 2</p>
                <h3 className="how_step_heading">Post Or Browse Food</h3>
                <div className="how_heading_line"></div>
                </div>
                <p classname="how_step_text">
                    Donors can post extra groceries, meals, or other food items they would
                    otherwise throw away. Each listing includes details such as the type of
                    food, quantity, and pickup location. Recipients can browse available
                    listings and search for food that fits their needs. The platform makes it
                    easy to connect people who have extra food with those who need it. This
                    helps reduce waste while supporting the local community.
                </p>
            </div>

            <div className="how_row_column how_col_dark">
                <div className="how_top">              
                <p className= "how_step_label">Step 3</p>
                <h3 className="how_step_heading">Arrange Pickup</h3>
                <div className="how_heading_line"></div>
                </div>
                <p classname="how_step_text">
                    Once a food item is claimed, both users can coordinate a pickup time that
                    works for them. The platform allows simple communication to ensure a
                    smooth exchange. Users can meet at a safe and agreed-upon location for
                    the handoff. This step ensures that food is distributed efficiently and
                    respectfully. By completing the pickup, you help reduce food waste and
                    make a positive impact in your community.
                </p>
            </div>

        </section>
            
    </div>
  );
}

export default HowItWorks;
