import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';

export const DashboardLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-12">
                    <Outlet />
                    <footer className="mt-auto py-4 text-center text-sm text-gray-500">
                        this webapplication make by <a href="https://www.napver.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">www.napver.com</a>
                    </footer>
                </main>
            </div>
        </div>
    );
};
