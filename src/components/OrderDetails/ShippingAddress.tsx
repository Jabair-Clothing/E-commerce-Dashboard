import React from 'react';
import { MapPin } from 'lucide-react';
import type { ShippingAddressSegment } from '../../types/order';

interface ShippingAddressProps {
    shippingAddress: ShippingAddressSegment | null;
}

export const ShippingAddress: React.FC<ShippingAddressProps> = ({ shippingAddress }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    Shipping Address
                </h2>
            </div>
            <div className="p-6">
                {shippingAddress ? (
                    <address className="text-sm text-gray-600 not-italic leading-relaxed">
                        <span className="font-medium text-gray-900">
                            {shippingAddress.f_name} {shippingAddress.l_name}
                        </span><br />
                        {shippingAddress.phone}<br />
                        {shippingAddress.address}<br />
                        {shippingAddress.city}, {shippingAddress.zip}
                    </address>
                ) : (
                    <p className="text-sm text-gray-500 italic">No shipping address provided.</p>
                )}
            </div>
        </div>
    );
};
