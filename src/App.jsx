import { AuthProvider, useAuth } from './context/AuthContext';
import { ReservationProvider } from './context/ReservationContext';
import LoginScreen from './components/Auth/LoginScreen';
import './App.css';

import MainLayout from './components/Layout/MainLayout';

function AppContent() {
    const { isAuthenticated } = useAuth();
    console.log('AppContent render:', { isAuthenticated });

    if (!isAuthenticated) {
        return <LoginScreen />;
    }

    return <MainLayout />;
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
