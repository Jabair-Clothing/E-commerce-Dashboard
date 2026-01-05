export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    role: string;
    type: string;
    phone: string;
    address: string | null;
    role_id: string | null;
    status: number;
    created_at: string;
    updated_at: string;
}

export interface LoginResponse {
    success: boolean;
    status: number;
    message: string;
    data: {
        user: User;
        token: string;
    } | null;
    errors: string | null;
}

import type { OrderInfo } from './pos';

export interface AuthContextType {
    user: User | null;
    token: string | null;
    orderInfo: OrderInfo | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}
