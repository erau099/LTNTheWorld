import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { registerFirebaseSW } from './registerFirebaseSW'

// Render React application
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

// Register Firebase Cloud Messaging Service Worker (DT-310)
registerFirebaseSW()