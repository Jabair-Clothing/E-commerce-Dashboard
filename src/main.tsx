// Polyfill for legacy libraries
import { createRoot } from 'react-dom/client'

if (typeof window !== 'undefined' && !(window as any).global) {
  (window as any).global = window;
}
import './index.css'
import './styles/print.css'
import App from './App'


createRoot(document.getElementById('root')!).render(
  <App />
)
