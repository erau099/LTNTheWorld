import './App.css'
import { HashRouter as Router, Routes, Route } from 'react-router-dom' // Imported to fix broken navigation
import HowItWorks from "./HowItWorks"
import Login from "./Login.jsx"
import Signup from "./Signup.jsx"
import UploadFoodDetails from "./food-upload/UploadFoodDetails.jsx"
import Home from "./Home.jsx"
import CDashboard from './CDashboard.jsx' // Imported to enable dashboard access after login
import DonorProfile from "./DonorProfile.jsx";
import ReceiverProfile from "./ReceiverProfile.jsx";
import About from "./AboutUs.jsx" 

function App() {
  return (
    <Router> {/* Wrapped in Router to enable application-wide navigation */}
      <Routes> {/* Added Routes container to manage different page paths */}
        <Route path="/" element={<Home />} /> {/* Defined root path for Home page */}
        <Route path="/Login" element={<Login />} /> {/* Defined path for Login page */}
        <Route path="/Signup" element={<Signup />} /> {/* Defined path for Signup page */}
        <Route path="/HowItWorks" element={<HowItWorks />} /> {/* Defined path for How It Works page */}
        <Route path="/UploadFoodDetails" element={<UploadFoodDetails />} /> {/* Defined path for Food Upload page */}
        <Route path="/Dashboard" element={<CDashboard />} /> {/* Added path for the new demo Dashboard */}
        <Route path="/donor-profile" element={<DonorProfile />} />
        <Route path="/receiver-profile" element={<ReceiverProfile />} />
        <Route path="/about" element={<About />} /> 
      </Routes>
    </Router>
  )
}

export default App