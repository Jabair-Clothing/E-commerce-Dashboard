import React from 'react';
import { User } from 'lucide-react';
import type { UserSegment } from '../../types/order';

interface CustomerInfoProps {
    user: UserSegment | null;
    // Guest user info from order object
    guestName?: string | null;
    guestPhone?: string | null;
}

export const CustomerInfo: React.FC<CustomerInfoProps> = ({ user, guestName, guestPhone }) => {
    const isGuest = !user;
    const displayName = isGuest ? (guestName || 'Guest User') : user.name;
    const displayPhone = isGuest ? guestPhone : user.phone;
    const displayEmail = isGuest ? null : user.email;

    return (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-400" />
                    Customer Details
                    {isGuest && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Guest</span>
                    )}
                </h2>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-sm text-gray-900 font-medium">{displayName}</p>
                </div>
                {!isGuest && (
                    <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-sm text-gray-900">{displayEmail || 'N/A'}</p>
                    </div>
                )}
                <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{displayPhone || 'N/A'}</p>
                </div>
            </div>
        </div>
    );
};
