import React from 'react';
import { CreditCard } from 'lucide-react';
import type { PaymentSegment } from '../../types/order';

interface PaymentInfoProps {
    payments: PaymentSegment[];
}

export const PaymentInfo: React.FC<PaymentInfoProps> = ({ payments }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    Payment Information
                </h2>
            </div>
            <div className="p-6">
                {payments.length > 0 ? (
                    <div className="space-y-4">
                        {payments.map((payment) => (
                            <div key={payment.payment_id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        Payment Type: {payment.payment_type === "1" ? "Cash" : "Digital"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Status: {payment.status === "1" ? "Paid" : "Pending"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900">৳{payment.amount}</p>
                                    <p className="text-xs text-gray-500">
                                        Paid: ৳{payment.paid_amount}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">No payment records found.</p>
                )}
            </div>
        </div>
    );
};
