import React from 'react';
import type { CartItem } from '../../types/pos';

interface POSInvoiceProps {
    invoiceCode: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    cart: CartItem[];
    subtotal: number;
    shippingCharge: number;
    vatAmount: number;
    total: number;
    paymentType: number;
    createdAt: string;
}

export const POSInvoice: React.FC<POSInvoiceProps> = ({
    invoiceCode,
    customerName,
    customerPhone,
    customerAddress,
    cart,
    subtotal,
    shippingCharge,
    vatAmount,
    total,
    paymentType,
    createdAt
}) => {
    return (
        <div className="pos-invoice-container hidden print:block bg-white p-4 mx-auto" style={{ maxWidth: '80mm' }}>
            {/* Header */}
            <div className="text-center border-b-2 border-gray-800 pb-2 mb-3">
                <h1 className="text-lg font-bold text-gray-900">SALES RECEIPT</h1>
                <p className="text-xs text-gray-600 mt-1">Your Store Name</p>
                <p className="text-xs text-gray-500 mt-1">Invoice: {invoiceCode}</p>
                <p className="text-xs text-gray-500">{createdAt}</p>
            </div>

            {/* Customer Info */}
            <div className="mb-3 text-xs">
                <p className="font-bold text-gray-900">Customer:</p>
                <p className="text-gray-700">{customerName}</p>
                <p className="text-gray-600">{customerPhone}</p>
                {customerAddress && <p className="text-gray-600">{customerAddress}</p>}
            </div>

            {/* Items Table */}
            <table className="w-full mb-3 text-xs">
                <thead>
                    <tr className="border-b-2 border-gray-800">
                        <th className="text-left py-1">Item</th>
                        <th className="text-center py-1">Qty</th>
                        <th className="text-right py-1">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {cart.map((item, index) => (
                        <tr key={index} className="border-b border-gray-300">
                            <td className="py-1">
                                <div className="font-medium">{item.name}</div>
                                {item.variant_description && (
                                    <div className="text-xs text-gray-600">{item.variant_description}</div>
                                )}
                                <div className="text-xs text-gray-500">৳{item.variant_price || item.price}</div>
                            </td>
                            <td className="text-center py-1">{item.cartQuantity}</td>
                            <td className="text-right py-1 font-medium">
                                ৳{(parseFloat(item.variant_price || item.price) * item.cartQuantity).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="border-t-2 border-gray-800 pt-2 mb-3">
                <div className="flex justify-between text-xs py-0.5">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">৳{subtotal.toFixed(2)}</span>
                </div>
                {shippingCharge > 0 && (
                    <div className="flex justify-between text-xs py-0.5">
                        <span className="text-gray-600">Shipping:</span>
                        <span className="text-gray-900">৳{shippingCharge.toFixed(2)}</span>
                    </div>
                )}
                {vatAmount > 0 && (
                    <div className="flex justify-between text-xs py-0.5">
                        <span className="text-gray-600">VAT:</span>
                        <span className="text-gray-900">৳{vatAmount.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-sm py-1 border-t border-gray-400 mt-1">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">৳{total.toFixed(2)}</span>
                </div>
            </div>

            {/* Payment Method */}
            <div className="text-xs mb-3">
                <p className="text-gray-600">
                    Payment: <span className="font-medium text-gray-900">
                        {paymentType === 1 ? 'Cash' : 'Digital'}
                    </span>
                </p>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-300 pt-2 text-center">
                <p className="text-xs text-gray-600">Thank you!</p>
                <p className="text-xs text-gray-500 mt-1">
                    Software by <span className="font-medium">napver.com</span>
                </p>
            </div>
        </div>
    );
};
