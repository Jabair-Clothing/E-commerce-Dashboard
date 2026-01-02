import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to the login page, but save the current location they were testing
        // to send them back to after they login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
