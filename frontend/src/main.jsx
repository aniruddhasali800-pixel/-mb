import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { SpeedInsights } from "@vercel/speed-insights/react"


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <SpeedInsights />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
