import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Search, Eye, Filter, Trash2 } from 'lucide-react';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/apiClient';

interface Order {
    user_name: string;
    user_phone: string;
    user_email: string | null;
    order_id: number;
    invoice_code: string;
    status: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    order_placed_date_time: string;
}

interface OrderResponse {
    success: boolean;
    status: number;
    message: string;
    data: Order[];
    status_summary: {
        processing: number;
        completed: number;
        on_hold: number;
        cancelled: number;
        refunded: number;
    };
    pagination?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
        from: number;
        to: number;
    };
}

export const Orders: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const limit = 10;

    const { data: apiResponse, isLoading, isError } = useQuery({
        queryKey: ['orders', page, search, startDate, endDate],
        queryFn: async () => {
            const url = new URL(endpoints.orders.all);
            url.searchParams.append('page', page.toString());
            url.searchParams.append('limit', limit.toString());
            if (search) url.searchParams.append('search', search);
            if (startDate) url.searchParams.append('start_date', startDate);
            if (endDate) url.searchParams.append('end_date', endDate);

            const response = await fetchWithAuth(url.toString());
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json() as Promise<OrderResponse>;
        },
        placeholderData: keepPreviousData,
        staleTime: 30000,
        enabled: !!token,
    });

    const orders = apiResponse?.data || [];
    const statusSummary = apiResponse?.status_summary;
    const pagination = apiResponse?.pagination;

    const queryClient = useQueryClient();

    const handlePageChange = (newPage: number) => {
        if (pagination && newPage >= 1 && newPage <= pagination.last_page) {
            setPage(newPage);
        }
    };




    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number, status: number }) => {
            const response = await fetchWithAuth(endpoints.orders.updateStatus(id), {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
            if (!response.ok) throw new Error('Failed to update status');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (error) => {
            alert('Failed to update status: ' + error.message);
        }
    });

    const deleteOrderMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetchWithAuth(endpoints.orders.delete(id), {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete order');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (error) => {
            alert('Failed to delete order: ' + error.message);
        }
    });

    const handleDeleteOrder = (orderId: number) => {
        if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            deleteOrderMutation.mutate(orderId);
        }
    };

    const handleStatusChange = (orderId: number, newStatus: string) => {
        const statusCode = parseInt(newStatus);
        if (!isNaN(statusCode)) {
            updateStatusMutation.mutate({ id: orderId, status: statusCode });
        }
    };

    const getStatusColor = (status: number) => {
        switch (status) {
            case 1: return 'bg-green-100 text-green-800'; // Completed
            case 0: return 'bg-blue-100 text-blue-800';   // Processing
            case 3: return 'bg-red-100 text-red-800';     // Cancelled
            case 2: return 'bg-yellow-100 text-yellow-800'; // On Hold
            case 4: return 'bg-gray-100 text-gray-800';   // Refunded
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isError) {
        return <div className="p-4 text-red-500">Error loading orders. Please try again.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            </div>

            {/* Status Summary */}
            {statusSummary && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                    <div className="rounded-xl bg-blue-50 p-4 ring-1 ring-blue-200">
                        <div className="text-sm font-medium text-blue-600">Processing</div>
                        <div className="mt-1 text-2xl font-bold text-blue-900">{statusSummary.processing}</div>
                    </div>
                    <div className="rounded-xl bg-green-50 p-4 ring-1 ring-green-200">
                        <div className="text-sm font-medium text-green-600">Completed</div>
                        <div className="mt-1 text-2xl font-bold text-green-900">{statusSummary.completed}</div>
                    </div>
                    <div className="rounded-xl bg-yellow-50 p-4 ring-1 ring-yellow-200">
                        <div className="text-sm font-medium text-yellow-600">On Hold</div>
                        <div className="mt-1 text-2xl font-bold text-yellow-900">{statusSummary.on_hold}</div>
                    </div>
                    <div className="rounded-xl bg-red-50 p-4 ring-1 ring-red-200">
                        <div className="text-sm font-medium text-red-600">Cancelled</div>
                        <div className="mt-1 text-2xl font-bold text-red-900">{statusSummary.cancelled}</div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
                        <div className="text-sm font-medium text-gray-600">Refunded</div>
                        <div className="mt-1 text-2xl font-bold text-gray-900">{statusSummary.refunded}</div>
                    </div>
                </div>
            )}

            <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
                {/* Filters */}
                {/* Filters */}
                <div className="border-b border-gray-200 p-6 bg-white">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by Invoice, Name, Phone, Email..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="block w-full rounded-xl border-gray-300 pl-11 py-3 bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-200 shadow-sm">
                            <div className="relative">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setPage(1);
                                    }}
                                    className="block w-full rounded-lg border-0 bg-transparent py-2 pl-3 pr-2 text-sm text-gray-900 focus:ring-0 placeholder-gray-400 cursor-pointer"
                                    placeholder="Start Date"
                                />
                            </div>
                            <div className="h-6 w-px bg-gray-300"></div>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setPage(1);
                                    }}
                                    className="block w-full rounded-lg border-0 bg-transparent py-2 pl-2 pr-3 text-sm text-gray-900 focus:ring-0 placeholder-gray-400 cursor-pointer"
                                    placeholder="End Date"
                                />
                            </div>
                        </div>

                        {(search || startDate || endDate) && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setStartDate('');
                                    setEndDate('');
                                    setPage(1);
                                }}
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm group"
                            >
                                <Filter className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">Loading orders...</td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">No orders found matching your criteria.</td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.order_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-primary-600">#{order.invoice_code}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{order.user_name}</div>
                                            <div className="text-xs text-gray-500">{order.user_phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="relative">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                                                    disabled={updateStatusMutation.isPending}
                                                    className={`appearance-none rounded-full px-3 py-1 text-xs font-medium border-0 focus:ring-2 focus:ring-primary-500 cursor-pointer ${getStatusColor(order.status)}`}
                                                    style={{ paddingRight: '1.5rem' }}
                                                >
                                                    <option value={0}>Processing</option>
                                                    <option value={1}>Completed</option>
                                                    <option value={2}>On Hold</option>
                                                    <option value={3}>Cancelled</option>
                                                    <option value={4}>Refunded</option>
                                                </select>
                                                {/* Down Arrow Icon Overlay if needed, or browser default */}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">৳{order.total_amount}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-green-600">৳{order.paid_amount}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`text-sm ${order.due_amount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                                ৳{order.due_amount}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{order.order_placed_date_time}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => navigate(`/orders/${order.order_id}`)}
                                                className="text-gray-400 hover:text-primary-600 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteOrder(order.order_id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                                                title="Delete Order"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && (
                    <div className="border-t border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <p>Showing {pagination.from} to {pagination.to} of {pagination.total} results</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === pagination.last_page}
                                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
