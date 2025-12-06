import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './dashboard-responsive.css'
import './calendar-styles.css'
import './calendar-mobile.css'
import './modal-styles.css'
import './i18n'; // Import i18n config

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>,
)
