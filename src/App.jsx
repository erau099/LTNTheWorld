import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import HowItWorks from "./HowItWorks"
import Login from "./Login.jsx"
import Signup from "./Signup.jsx"
import UploadFoodDetails from "./food-upload/UploadFoodDetails.jsx"
import Home from "./Home.jsx"
import CDashboard from "./CDashboard.jsx"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/HowItWorks" element={<HowItWorks />} />
        <Route path="/UploadFoodDetails" element={<UploadFoodDetails />} />
        <Route path="/CDashboard" element={<CDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
