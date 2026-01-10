import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { User, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { endpoints } from '../config';
import { fetchWithAuth } from '../utils/apiClient';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from local storage", error);
            localStorage.removeItem('user');
            return null;
        }
    });
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('token');
    });
    const [orderInfo, setOrderInfo] = useState<any | null>(() => {
        try {
            const savedOrderInfo = localStorage.getItem('orderInfo');
            return savedOrderInfo ? JSON.parse(savedOrderInfo) : null;
        } catch (error) {
            localStorage.removeItem('orderInfo');
            return null;
        }
    });

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        // Fetch order info immediately after login
        fetchOrderInfo();
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setOrderInfo(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('orderInfo');
    };

    const fetchOrderInfo = async () => {
        try {
            const response = await fetchWithAuth(endpoints.orderInfo.get);
            if (response.ok) {
                const data = await response.json();
                if (data.data) {
                    setOrderInfo(data.data);
                    localStorage.setItem('orderInfo', JSON.stringify(data.data));
                }
            }
        } catch (error) {
            console.error("Failed to fetch order info", error);
        }
    };

    React.useEffect(() => {
        if (token && !orderInfo) {
            fetchOrderInfo();
        }
    }, [token, orderInfo]);

    React.useEffect(() => {
        const handleLogout = () => {
            logout();
        };

        window.addEventListener('auth:logout', handleLogout);

        return () => {
            window.removeEventListener('auth:logout', handleLogout);
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, orderInfo, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
