import './App.css'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'

import Home from './Home.jsx'
import HowItWorks from './HowItWorks.jsx'
import Login from './Login.jsx'
import Signup from './Signup.jsx'
import CDashboard from './CDashboard.jsx'
import UploadFoodDetails from './food-upload/UploadFoodDetails.jsx'
import RecipientPastOrders from "./recipient-orders/RecipientPastOrders";
import DonorPastListings from "./donor-listings/DonorPastListings";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/HowItWorks" element={<HowItWorks />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/Dashboard" element={<CDashboard />} />
        <Route path="/UploadFoodDetails" element={<UploadFoodDetails />} />
        
      </Routes>
    </Router>
  )
}

export default App