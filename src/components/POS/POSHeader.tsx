import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Monitor, X } from 'lucide-react';

interface POSHeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export const POSHeader: React.FC<POSHeaderProps> = ({ searchTerm, setSearchTerm }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white p-4 border-b flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="h-6 w-6 text-gray-500" />
                </button>
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Monitor className="h-6 w-6 text-primary-600" />
                    POS System
                </h1>
            </div>
            <div className="relative w-full max-w-md ml-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
    );
};
