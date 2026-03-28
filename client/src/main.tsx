import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './store/theme-store';
import './store/language-store';
import './lib/i18n';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
