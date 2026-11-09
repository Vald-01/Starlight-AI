import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import { loadStoredApiKeys } from '@/lib/aiSettings'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import '@/index.css'

loadStoredApiKeys().catch((error) => console.error('[Keychain] read failed:', error))

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
