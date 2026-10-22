import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {AimBar, AimFooter} from './AimBar.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AimBar />
    <App />
    <AimFooter />
  </StrictMode>,
);
