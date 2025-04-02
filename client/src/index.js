import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { FinancialProvider } from './context/FinancialContext';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import theme from './theme';
import './index.css';

// Disable browser bounce effect on iOS when scrolling
document.documentElement.style.overscrollBehavior = 'none';
document.body.style.overscrollBehavior = 'none';

// Add touch-specific styling
if ('ontouchstart' in document.documentElement) {
  document.body.classList.add('touch-device');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <FinancialProvider>
            <Router>
              <App />
            </Router>
          </FinancialProvider>
        </AuthProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>
); 