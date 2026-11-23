import DashboardHeader from "./components/DashboardHeader";
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'; // Added for logout redirection
import { getCurrentUser } from './utils/auth'; // Added for session management
import "./index.css";
import "./CDashboard.css";

function CDashboard() {  
    const navigate = useNavigate(); // Hook to programmatically navigate between pages
    const [user] = useState(() => getCurrentUser()); // State to store currently logged in user

    useEffect(() => {
        if (!user) {
            navigate("/Login"); // Kick unauthenticated users back to login
        }
    }, [user, navigate]);

    if (!user) return null; // Don't render until user state is loaded

    return (
        <div className="cdashboard">
            {/* NavBar */}
            <DashboardHeader />

            <div className="dashboard_content">
                <h1>Welcome to your Dashboard</h1>
                {/* Display dynamic welcome message with full name */}
                <p>Glad to have you back, {user.firstName} {user.lastName}!</p>
                {/* Visual indicator of the user's role */}
                <div className="role_badge">{user.role}</div>

                {/* Simulated JSON display for demo purposes */}
                <div className="user_json_simulation">
                    <h3>User Data (JSON Simulation):</h3>
                    <p style={{fontSize: '0.8rem', color: '#888', marginBottom: '10px'}}>
                        This data is stored in your browser's local storage and was "generated" upon account creation.
                    </p>
                    <pre>{JSON.stringify(user, null, 2)}</pre>
                </div>
            </div>
        </div>
    );
}

export default CDashboard;
