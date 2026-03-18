import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'
import { initFontCheck } from './fontCheck'

// Kiểm tra font tiếng Việt ngay khi app khởi động
// Log warning nếu Google Fonts không load được (WebView/offline)
initFontCheck()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          background: '#1e293b',
          color: '#fff',
          fontFamily: "'Be Vietnam Pro', 'Nunito', system-ui, -apple-system, Roboto, Arial, sans-serif",
          fontWeight: 600,
          fontSize: '15px',
          borderRadius: '12px',
          padding: '12px 16px',
        },
        success: {
          iconTheme: { primary: '#10b981', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
          duration: 5000,
        },
      }}
    />
    <App />
  </StrictMode>,
)
