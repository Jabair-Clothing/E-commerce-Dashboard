import React, { useState } from 'react';
import { CreditCard, Pencil, X, Check, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../../config';
import { useAuth } from '../../context/AuthContext';
import type { PaymentSegment } from '../../types/order';

interface PaymentInfoProps {
    payments: PaymentSegment[];
    orderId: string;
}

export const PaymentInfo: React.FC<PaymentInfoProps> = ({ payments, orderId }) => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{
        status: number;
        paidAmount: string;
    }>({
        status: 0,
        paidAmount: '',
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ paymentId, status }: { paymentId: number; status: number }) => {
            const response = await fetch(endpoints.payments.updateStatus(paymentId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update payment status');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
        }
    });

    const updateAmountMutation = useMutation({
        mutationFn: async ({ paymentId, amount }: { paymentId: number; amount: number }) => {
            const response = await fetch(endpoints.payments.updatePaidAmount(paymentId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ paid_amount: amount })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update paid amount');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
        }
    });

    const handleEditClick = (payment: PaymentSegment) => {
        setEditingPaymentId(payment.payment_id);
        // Map current payment type/status back to the status options
        // 0: Unpaid, 1: Cash, 2: Credit Card, 3: Online
        let currentStatus = 0;
        if (payment.status === '1') {
            // If status is 1 (Paid), set status based on payment_type (1, 2, or 3)
            currentStatus = parseInt(payment.payment_type);
        } else {
            // If status is 0 (Pending/Unpaid), set status to 0
            currentStatus = 0;
        }

        setEditForm({
            status: currentStatus,
            paidAmount: payment.paid_amount.toString(),
        });
    };

    const handleCancel = () => {
        setEditingPaymentId(null);
        setEditForm({ status: 0, paidAmount: '' });
    };

    const handleSave = async (paymentId: number, totalAmount: number) => {
        try {
            // Validate amount
            const newAmount = parseFloat(editForm.paidAmount);
            if (isNaN(newAmount) || newAmount < 0) {
                alert('Please enter a valid amount');
                return;
            }
            if (newAmount > totalAmount) {
                alert('Paid amount cannot be greater than total amount');
                return;
            }

            // Execute mutations
            await updateStatusMutation.mutateAsync({ paymentId, status: editForm.status });

            // Only update amount if it changed
            const payment = payments.find(p => p.payment_id === paymentId);
            if (payment && parseFloat(payment.paid_amount.toString()) !== newAmount) {
                await updateAmountMutation.mutateAsync({ paymentId, amount: newAmount });
            }

            setEditingPaymentId(null);
        } catch (error: any) {
            alert(error.message);
        }
    };

    const isProcessing = updateStatusMutation.isPending || updateAmountMutation.isPending;

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
                            <div key={payment.payment_id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                                {editingPaymentId === payment.payment_id ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Status / Type</label>
                                                <select
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                                                    value={editForm.status}
                                                    onChange={(e) => setEditForm({ ...editForm, status: parseInt(e.target.value) })}
                                                >
                                                    <option value={0}>Unpaid</option>
                                                    <option value={1}>Cash Payment</option>
                                                    <option value={2}>Credit Card</option>
                                                    <option value={3}>Online Payment</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Paid Amount</label>
                                                <input
                                                    type="number"
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                                                    value={editForm.paidAmount}
                                                    onChange={(e) => setEditForm({ ...editForm, paidAmount: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={handleCancel}
                                                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                                                disabled={isProcessing}
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleSave(payment.payment_id, parseFloat(payment.amount.toString()))}
                                                className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                                                disabled={isProcessing}
                                            >
                                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                Payment Type: {payment.payment_type === "0" ? "None" : (payment.payment_type === "1" ? "Cash" : "Digital")}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Status: {payment.status === "1" ? "Paid" : "Pending/Unpaid"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gray-900">৳{payment.amount}</p>
                                                <p className="text-xs text-red-500 font-medium">
                                                    Due: ৳{payment.due_amount}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Paid: ৳{payment.paid_amount}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleEditClick(payment)}
                                                className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                                                title="Edit Payment"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
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
