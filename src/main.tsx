import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyTextSizeLevel, loadTextSizeLevel } from './lib/textSize'
import App from './App.tsx'

applyTextSizeLevel(loadTextSizeLevel())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
