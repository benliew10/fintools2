import React, { useContext, lazy, Suspense, Component } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import Layout from './components/Layout/Layout';

// Error Boundary component to prevent app crashes
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Reload only the current route without full page refresh
    window.location.href = window.location.pathname;
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          p: 3 
        }}>
          <Typography variant="h4" gutterBottom color="error">
            Something went wrong
          </Typography>
          <Typography variant="body1" paragraph sx={{ maxWidth: 500, textAlign: 'center', mb: 3 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={this.handleReset}
          >
            Reload Application
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const Expenses = lazy(() => import('./pages/Expenses/Expenses'));
const Revenues = lazy(() => import('./pages/Revenues/Revenues'));
const Assets = lazy(() => import('./pages/Assets/Assets'));
const Transactions = lazy(() => import('./pages/Transactions/Transactions'));
const Products = lazy(() => import('./pages/Products/Products'));
const FounderContributions = lazy(() => import('./pages/FounderContributions/FounderContributions'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
          </Box>
        }
      >
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
            <Route path="expenses" element={<ErrorBoundary><Expenses /></ErrorBoundary>} />
            <Route path="revenues" element={<ErrorBoundary><Revenues /></ErrorBoundary>} />
            <Route path="assets" element={<ErrorBoundary><Assets /></ErrorBoundary>} />
            <Route path="products" element={<ErrorBoundary><Products /></ErrorBoundary>} />
            <Route path="transactions" element={<ErrorBoundary><Transactions /></ErrorBoundary>} />
            <Route path="founder-contributions" element={<ErrorBoundary><FounderContributions /></ErrorBoundary>} />
            <Route path="profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App; 