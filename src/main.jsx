import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Sepolia } from "@thirdweb-dev/chains";
import { ThemeProvider } from './context/ThemeContext'

// Remove any existing theme classes from the document root
document.documentElement.classList.remove('light', 'dark');
// Add the initial theme class based on localStorage or system preference
document.documentElement.classList.add(
  localStorage.getItem('theme') || 
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ThirdwebProvider 
        activeChain={Sepolia}
        clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID}
      >
        <App />
      </ThirdwebProvider>
    </ThemeProvider>
  </React.StrictMode>,
)