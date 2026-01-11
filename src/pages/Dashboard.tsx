import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingBag, Users, Activity, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { fetchWithAuth } from '../utils/apiClient';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';

interface RecentOrder {
    order_id: number;
    invoice_code: string;
    status: number;
    total_amount: string | number;
    customer_name: string;
    placed_at: string;
    time_ago: string;
}

interface DueOrder {
    user_name: string;
    user_phone: string;
    user_email: string | null;
    order_id: number;
    invoice_code: string;
    status: number | string;
    total_amount: string | number;
    paid_amount: string | number;
    due_amount: number;
    order_placed_date_time: string;
    placed_human: string;
}

interface DashboardData {
    total_order_count: number;
    new_order_count: number;
    today_order_count: number;
    total_revenue: number | string;
    today_revenue: number | string;
    total_client_count: number;
    due_orders: {
        count: number;
        total_due_amount: number;
        list: DueOrder[];
    };
    recent_orders: RecentOrder[];
    charts: {
        orders_last_7_days: { date: string; orders: number }[];
        revenue_last_7_days: { date: string; revenue: number }[];
        status_distribution: { status: string; count: number }[];
    };
}

export const Dashboard: React.FC = () => {
    const { token } = useAuth();
    const [timeRange, setTimeRange] = useState('Last 7 days');

    const { data: dashboardData, isLoading, error } = useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => {
            const response = await fetchWithAuth(endpoints.dashboard);
            if (!response.ok) throw new Error('Failed to fetch dashboard data');
            const result = await response.json();
            return result.data as DashboardData;
        },
        enabled: !!token
    });

    if (isLoading) {
        return (
            <div className="flex bg-gray-50 h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg">
                Error loading dashboard: {error.message}
            </div>
        );
    }

    const data = dashboardData!;

    const stats = [
        {
            label: 'Total Revenue',
            value: `\u09F3${Number(data.total_revenue).toLocaleString()} `,
            change: `+\u09F3${Number(data.today_revenue).toLocaleString()} today`, // Showing today's revenue as change for now
            icon: DollarSign,
            color: 'text-green-600',
            bg: 'bg-green-100',
            trend: 'up'
        },
        {
            label: 'Total Orders',
            value: data.total_order_count.toLocaleString(),
            change: `+ ${data.today_order_count} today`,
            icon: ShoppingBag,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
            trend: 'up'
        },
        {
            label: 'Total Clients',
            value: data.total_client_count.toLocaleString(),
            change: 'Active',
            icon: Users,
            color: 'text-purple-600',
            bg: 'bg-purple-100',
            trend: 'neutral'
        },
        {
            label: 'Total Due',
            value: `\u09F3${data.due_orders.total_due_amount.toLocaleString()}`,
            change: `${data.due_orders.count} orders`,
            icon: Activity,
            color: 'text-amber-600',
            bg: 'bg-amber-100',
            trend: 'down' // Assuming due is bad/neutral
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="rounded-lg border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm"
                >
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>This Year</option>
                </select>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <div key={index} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div className={cn("rounded-lg p-3", stat.bg)}>
                                <stat.icon className={cn("h-6 w-6", stat.color)} />
                            </div>
                            <span className={cn(
                                "text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1",
                                stat.trend === 'up' ? 'text-green-700 bg-green-50' :
                                    stat.trend === 'down' ? 'text-amber-700 bg-amber-50' : 'text-gray-600 bg-gray-50'
                            )}>
                                {stat.trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
                                {stat.trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
                                {stat.change}
                            </span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
                            <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Welcome to ShopAdmin</h3>
                <p className="mt-2 text-gray-500">Select an item from the sidebar to get started.</p>
            </div>
        </div>
    );
};
