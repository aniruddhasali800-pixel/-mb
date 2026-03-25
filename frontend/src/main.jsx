import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import { SpeedInsights } from "@vercel/speed-insights/react"

console.log('🚀 Main.jsx is executing...');
const PUBLISHABLE_KEY = 'pk_test_Z2VudWluZS1raWQtNDQuY2xlcmsuYWNjb3VudHMuZGV2JA'

console.log('🔑 Using Clerk Key:', PUBLISHABLE_KEY);

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element found! Starting render...');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <BrowserRouter>
          <App />
          <SpeedInsights />
        </BrowserRouter>
      </ClerkProvider>
    </React.StrictMode>,
  )
  console.log('✨ Render call completed');
}
