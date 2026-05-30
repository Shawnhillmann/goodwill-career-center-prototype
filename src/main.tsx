import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyTextSizePercent, loadTextSizePercent } from './lib/textSize'
import App from './App.tsx'

applyTextSizePercent(loadTextSizePercent())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
