import { useState, useEffect } from 'react'
import './App.css'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import "./LightenTheWorld.css";
import HowItWorks from "./HowItWorks"
import Login from "./Login.jsx"
import Signup from "./Signup.jsx"
import UploadFoodDetails from "./food-upload/UploadFoodDetails.jsx"
import Home from "./Home.jsx"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>}></Route>
        <Route path="/UploadFoodDetails" element={<UploadFoodDetails/>}></Route>
        <Route path="/Login" element={<Login/>}></Route>
        <Route path="/Signup" element={<Signup/>}></Route>
        <Route path="/HowItWorks" element={<HowItWorks/>}></Route>
      </Routes>
    </Router>
  )
}

export default App
