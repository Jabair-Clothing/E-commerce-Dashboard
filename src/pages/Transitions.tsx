import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';
import type { TransitionResponse } from '../types/transition';
import { Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export const Transitions: React.FC = () => {
    const { token } = useAuth();
    const [page, setPage] = useState(1);
    const [duration, setDuration] = useState<string>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [limit] = useState(10);

    // Fetch Transitions
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['transitions', page, duration, startDate, endDate],
        queryFn: async () => {
            const url = new URL(endpoints.transitions.all);
            url.searchParams.append('page', page.toString());
            url.searchParams.append('limit', limit.toString());

            if (duration) url.searchParams.append('duration', duration);
            if (startDate) url.searchParams.append('start_date', startDate);
            if (endDate) url.searchParams.append('end_date', endDate);

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch transitions');
            }

            return response.json() as Promise<TransitionResponse>;
        },
        enabled: !!token
    });

    const handleDurationChange = (newDuration: string) => {
        setDuration(newDuration);
        setStartDate(''); // Clear custom dates when using presets
        setEndDate('');
        setPage(1);
    };

    const handleApplyFilter = () => {
        setDuration(''); // Clear preset when using custom dates
        setPage(1);
        refetch();
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo(0, 0);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-8 text-center text-red-500">
                Failed to load transitions. Please try again.
            </div>
        );
    }

    const transitions = data?.data || [];
    const pagination = data?.pagination;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Payment Transitions</h1>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filter:
                        </span>
                        <button
                            onClick={() => handleDurationChange('today')}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${duration === 'today'
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => handleDurationChange('this_week')}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${duration === 'this_week'
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            This Week
                        </button>
                        <button
                            onClick={() => handleDurationChange('this_month')}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${duration === 'this_month'
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            This Month
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-l border-gray-200 pl-4">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Range:
                        </span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <button
                            onClick={handleApplyFilter}
                            className="px-4 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Payment ID</th>
                                <th className="px-6 py-4">Invoice Code</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4">Status / Type</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {transitions.length > 0 ? (
                                transitions.map((transition) => (
                                    <tr key={transition.transition_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-900">#{transition.transition_id}</td>
                                        <td className="px-6 py-4 text-gray-600">{transition.payment_id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                                                    #{transition.payment_details.invoice_code}
                                                </span>
                                                {transition.payment_details.due_amount > 0 && (
                                                    <span className="text-xs text-red-500 font-medium mt-1">
                                                        Due: ৳{transition.payment_details.due_amount}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                                            ৳{transition.amount}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className={`text-xs font-medium ${transition.payment_details.status === '1' ? 'text-green-600' : 'text-yellow-600'
                                                    }`}>
                                                    {transition.payment_details.status === '1' ? 'Paid' : 'Pending'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {transition.payment_details.payment_type === '1' ? 'Cash' :
                                                        transition.payment_details.payment_type === '2' ? 'Credit Card' :
                                                            transition.payment_details.payment_type === '3' ? 'Online' : 'Unpaid'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(transition.created_at).toLocaleDateString()}
                                            <span className="block text-xs text-gray-400">
                                                {new Date(transition.created_at).toLocaleTimeString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No transitions found within the selected range.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {pagination.from} to {pagination.to} of {pagination.total} results
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-300">
                                Page {page} of {pagination.last_page}
                            </span>
                            <button
                                onClick={() => handlePageChange(Math.min(pagination.last_page, page + 1))}
                                disabled={page === pagination.last_page}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
