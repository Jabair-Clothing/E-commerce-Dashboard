import React from 'react';
import type { OrderSegment } from '../../types/order';

interface OrderSummaryProps {
    order: OrderSegment;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ order }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
            </div>
            <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>৳{order.item_subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span>৳{order.shipping_charge}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Discount</span>
                    <span className="text-green-600">-৳{order.discount}</span>
                </div>
                <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-gray-900">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">৳{order.total_amount}</span>
                </div>
            </div>
        </div>
    );
};
