import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReservationProvider } from './context/ReservationContext';
import LoginScreen from './components/Auth/LoginScreen';
import MainLayout from './components/Layout/MainLayout';
import PublicLayout from './components/Public/PublicLayout';
import LandingPage from './components/Public/LandingPage';
import PublicBooking from './components/Public/PublicBooking';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

function AppContent() {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
                <Route index element={<LandingPage />} />
                <Route path="book" element={<PublicBooking />} />
            </Route>

            {/* Auth Route - Redirect to admin if already logged in */}
            <Route path="/login" element={
                isAuthenticated ? <Navigate to="/admin" replace /> : <LoginScreen />
            } />

            {/* Protected Admin Routes */}
            <Route path="/admin/*" element={
                <ProtectedRoute>
                    <MainLayout />
                </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <ReservationProvider>
                <AppContent />
            </ReservationProvider>
        </AuthProvider>
    );
}

export default App;
