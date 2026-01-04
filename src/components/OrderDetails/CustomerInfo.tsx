import React from 'react';
import { User } from 'lucide-react';
import type { UserSegment } from '../../types/order';

interface CustomerInfoProps {
    user: UserSegment;
}

export const CustomerInfo: React.FC<CustomerInfoProps> = ({ user }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-400" />
                    Customer Details
                </h2>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-sm text-gray-900 font-medium">{user.name}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{user.email || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{user.phone || 'N/A'}</p>
                </div>
            </div>
        </div>
    );
};
