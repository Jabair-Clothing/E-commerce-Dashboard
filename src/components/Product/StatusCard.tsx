import React from 'react';

interface StatusCardProps {
    isActive: boolean;
    isPending: boolean;
    onToggle: () => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({ isActive, isPending, onToggle }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Active Status</span>
                <button
                    onClick={onToggle}
                    disabled={isPending}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${isActive ? 'bg-primary-600' : 'bg-gray-200'} ${isPending ? 'opacity-50' : ''}`}
                >
                    <span className="sr-only">Use setting</span>
                    <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                </button>
            </div>
        </div>
    );
};
