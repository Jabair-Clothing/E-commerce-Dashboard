import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';
import type { ActivityResponse } from '../types/activity';
import { Activity as ActivityIcon, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchWithAuth } from '../utils/apiClient';

export const Activities: React.FC = () => {
    const { token } = useAuth();
    const [page, setPage] = useState(1);
    const [limit] = useState(20);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['activities', page],
        queryFn: async () => {
            const url = new URL(endpoints.activities.all);
            url.searchParams.append('page', page.toString());
            url.searchParams.append('limit', limit.toString());

            const response = await fetchWithAuth(url.toString());

            return response.json() as Promise<ActivityResponse>;
        },
        enabled: !!token
    });

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
                Failed to load activities. Please try again.
            </div>
        );
    }

    const activities = data?.data || [];
    const pagination = data?.pagination;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-200">
                    {activities.length > 0 ? (
                        activities.map((activity) => (
                            <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <ActivityIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-gray-900">
                                                {activity.description}
                                            </p>
                                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(activity.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {activity.user ? activity.user.name : 'System'}
                                            </span>
                                            {activity.log_name && (
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                    {activity.log_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            No activities found.
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination && pagination.total_pages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Page {pagination.current_page} of {pagination.total_pages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => handlePageChange(Math.min(pagination.total_pages, page + 1))}
                                disabled={!pagination.has_more_pages}
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
