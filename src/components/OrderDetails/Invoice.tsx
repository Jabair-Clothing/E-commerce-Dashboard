import React from 'react';
import type { OrderSegment, UserSegment, ShippingAddressSegment, OrderItemSegment, PaymentSegment } from '../../types/order';

interface InvoiceProps {
    order: OrderSegment;
    user: UserSegment | null;
    shippingAddress: ShippingAddressSegment | null;
    orderItems: OrderItemSegment[];
    payments: PaymentSegment[];
}

export const Invoice: React.FC<InvoiceProps> = ({ order, user, shippingAddress, orderItems }) => {
    const isGuest = !user;
    const customerName = isGuest ? order.user_name : user?.name;
    const customerPhone = isGuest ? order.user_phone : user?.phone;
    const customerEmail = isGuest ? null : user?.email;

    const getStatusText = (status: string) => {
        switch (Number(status)) {
            case 1: return 'Completed';
            case 0: return 'Processing';
            case 3: return 'Cancelled';
            case 2: return 'On Hold';
            case 4: return 'Refunded';
            default: return 'Unknown';
        }
    };

    return (
        <div className="invoice-container hidden print:block bg-white p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-6 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                        <p className="text-sm text-gray-600 mt-1">Your Store Name</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Invoice #</p>
                        <p className="text-lg font-bold text-gray-900">{order.invoice_code}</p>
                        <p className="text-sm text-gray-600 mt-2">Date</p>
                        <p className="text-sm text-gray-900">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Customer & Shipping Info */}
            <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase">Bill To</h3>
                    <p className="text-sm text-gray-900 font-medium">{customerName}</p>
                    {customerEmail && <p className="text-sm text-gray-600">{customerEmail}</p>}
                    {customerPhone && <p className="text-sm text-gray-600">{customerPhone}</p>}
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase">Ship To</h3>
                    {shippingAddress ? (
                        <>
                            <p className="text-sm text-gray-900 font-medium">
                                {shippingAddress.f_name} {shippingAddress.l_name}
                            </p>
                            <p className="text-sm text-gray-600">{shippingAddress.phone}</p>
                            <p className="text-sm text-gray-600">{shippingAddress.address}</p>
                            <p className="text-sm text-gray-600">{shippingAddress.city}, {shippingAddress.zip}</p>
                        </>
                    ) : order.address ? (
                        <p className="text-sm text-gray-600">{order.address}</p>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No shipping address</p>
                    )}
                </div>
            </div>

            {/* Status */}
            <div className="mb-6">
                <span className="inline-block px-3 py-1 text-sm font-medium bg-gray-100 text-gray-900 rounded">
                    Status: {getStatusText(order.status)}
                </span>
            </div>

            {/* Items Table */}
            <table className="w-full mb-6">
                <thead>
                    <tr className="border-b-2 border-gray-800">
                        <th className="text-left py-3 text-sm font-bold text-gray-900 uppercase">Item</th>
                        <th className="text-center py-3 text-sm font-bold text-gray-900 uppercase">Qty</th>
                        <th className="text-right py-3 text-sm font-bold text-gray-900 uppercase">Price</th>
                        <th className="text-right py-3 text-sm font-bold text-gray-900 uppercase">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {orderItems.map((item, index) => (
                        <tr key={index} className="border-b border-gray-200">
                            <td className="py-3 text-sm text-gray-900">
                                <div className="font-medium">{item.name}</div>
                                {item.attributes_text && (
                                    <div className="text-xs text-gray-600">{item.attributes_text}</div>
                                )}
                            </td>
                            <td className="text-center py-3 text-sm text-gray-900">{item.quantity}</td>
                            <td className="text-right py-3 text-sm text-gray-900">৳{item.price}</td>
                            <td className="text-right py-3 text-sm text-gray-900 font-medium">
                                ৳{(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-6">
                <div className="w-64">
                    <div className="flex justify-between py-2 text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="text-gray-900 font-medium">৳{order.item_subtotal}</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm">
                        <span className="text-gray-600">Shipping:</span>
                        <span className="text-gray-900 font-medium">৳{order.shipping_charge}</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="text-green-600 font-medium">-৳{order.discount}</span>
                    </div>
                    <div className="flex justify-between py-3 border-t-2 border-gray-800">
                        <span className="text-base font-bold text-gray-900">Total:</span>
                        <span className="text-lg font-bold text-gray-900">৳{order.total_amount}</span>
                    </div>
                </div>
            </div>


            {/* Footer */}
            <div className="border-t border-gray-200 pt-6 text-center">
                <p className="text-xs text-gray-600">Thank you for your business!</p>
                <p className="text-xs text-gray-500 mt-2">
                    This software is made by <span className="font-medium">napver.com</span>
                </p>
            </div>
        </div>
    );
};
