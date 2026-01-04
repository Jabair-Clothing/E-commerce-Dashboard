import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, User, Calendar, CreditCard, Package } from 'lucide-react';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';
import type { OrderDetailsResponse } from '../types/order';

export const OrderDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();

    const { data: apiResponse, isLoading, isError } = useQuery({
        queryKey: ['order', id],
        queryFn: async () => {
            const response = await fetch(endpoints.orders.getById(id!), {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch order details');
            return response.json() as Promise<OrderDetailsResponse>;
        },
        enabled: !!id && !!token,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (isError || !apiResponse?.success) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-4">Error loading order details.</p>
                <button
                    onClick={() => navigate('/orders')}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                >
                    Back to Orders
                </button>
            </div>
        );
    }

    const { order, user, shipping_address, order_items, payments } = apiResponse.data;

    const getStatusColor = (status: number) => {
        switch (Number(status)) {
            case 1: return 'bg-green-100 text-green-800'; // Completed
            case 0: return 'bg-blue-100 text-blue-800';   // Processing
            case 3: return 'bg-red-100 text-red-800';     // Cancelled
            case 2: return 'bg-yellow-100 text-yellow-800'; // On Hold
            case 4: return 'bg-gray-100 text-gray-800';   // Refunded
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: number) => {
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/orders')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            Order #{order.invoice_code}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(Number(order.status))}`}>
                                {getStatusText(Number(order.status))}
                            </span>
                        </h1>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            {order.created_at}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Items & Payment */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Package className="h-5 w-5 text-gray-400" />
                                Order Items
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {order_items.map((item) => (
                                <div key={item.product_id} className="p-6 flex gap-4">
                                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                                        {item.image ? (
                                            <img
                                                src={item.image.image_url}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                <Package className="h-8 w-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between">
                                                <h3 className="text-sm font-medium text-gray-900">
                                                    {item.name}
                                                </h3>
                                                <p className="text-sm font-medium text-gray-900">
                                                    ৳{item.price}
                                                </p>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {item.attributes_text || 'Standard'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <p className="text-gray-500">Qty: {item.quantity}</p>
                                            <p className="font-medium text-gray-900">
                                                Toal: ৳{parseFloat(item.price) * parseInt(item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Info */}
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
                </div>

                {/* Right Column - Customer & Summary */}
                <div className="space-y-6">
                    {/* Customer Details */}
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

                    {/* Shipping Address */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-gray-400" />
                                Shipping Address
                            </h2>
                        </div>
                        <div className="p-6">
                            {shipping_address ? (
                                <address className="text-sm text-gray-600 not-italic leading-relaxed">
                                    <span className="font-medium text-gray-900">
                                        {shipping_address.f_name} {shipping_address.l_name}
                                    </span><br />
                                    {shipping_address.phone}<br />
                                    {shipping_address.address}<br />
                                    {shipping_address.city}, {shipping_address.zip}
                                </address>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No shipping address provided.</p>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
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
                </div>
            </div>
        </div>
    );
};
