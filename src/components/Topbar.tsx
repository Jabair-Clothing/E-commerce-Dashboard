import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface TopbarProps {
    onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
    const { user } = useAuth();

    return (
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
            <button
                onClick={onMenuClick}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            >
                <Menu className="h-6 w-6" />
            </button>

            {/* Left side actions */}
            <div className="flex items-center gap-4">
                <Link
                    to="/pos"
                    className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors shadow-sm"
                >
                    <span className="hidden sm:inline">POS System</span>
                    <span className="sm:hidden">POS</span>
                </Link>
            </div>

            {/* Spacer to push content to right */}
            <div className="flex-1" />

            <div className="flex items-center gap-4">
                <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
                </button>

                <div className="relative">
                    <Link to="/profile" className="flex items-center gap-2 rounded-full border border-gray-200 p-1 pr-3 hover:bg-gray-50 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                            <User className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name || 'User'}</span>
                    </Link>
                </div>
            </div>
        </header>
    );
};
