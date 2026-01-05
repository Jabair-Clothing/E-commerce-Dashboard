import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingBag, Users, Activity, Loader2, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SalesChart } from '../components/SalesChart';
import { cn } from '../utils/cn';
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
    const navigate = useNavigate();
    const [timeRange, setTimeRange] = useState('Last 7 days');

    const { data: dashboardData, isLoading, error } = useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => {
            const response = await fetch(endpoints.dashboard, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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
            value: `৳${Number(data.total_revenue).toLocaleString()}`,
            change: `+৳${Number(data.today_revenue).toLocaleString()} today`, // Showing today's revenue as change for now
            icon: DollarSign,
            color: 'text-green-600',
            bg: 'bg-green-100',
            trend: 'up'
        },
        {
            label: 'Total Orders',
            value: data.total_order_count.toLocaleString(),
            change: `+${data.today_order_count} today`,
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
            value: `৳${data.due_orders.total_due_amount.toLocaleString()}`,
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 lg:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Revenue Analytics</h2>
                    </div>
                    <SalesChart data={data.charts.revenue_last_7_days} />
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 flex flex-col">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[300px]">
                        {data.recent_orders.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                        ) : (
                            data.recent_orders.map((order) => (
                                <div key={order.order_id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-600 font-bold text-xs shadow-sm">
                                        {order.invoice_code.replace('ZT', '')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            New order by {order.customer_name}
                                        </p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <Clock className="h-3 w-3" />
                                            {order.time_ago}
                                        </p>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                                        ৳{Number(order.total_amount).toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => navigate('/orders')}
                            className="w-full py-2 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded-lg transition-colors"
                        >
                            View All Orders
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent/Due Orders Table */}
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900">Due Orders</h2>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {data.due_orders.count} Pending
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.due_orders.list.slice(0, 5).map((order) => (
                                <tr
                                    key={order.order_id}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/orders/${order.order_id}`)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                                        #{order.invoice_code}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {order.user_name}
                                        <div className="text-xs text-gray-500">{order.user_phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {order.placed_human}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                        ৳{Number(order.due_amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Due
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {data.due_orders.list.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                                        No pending due orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
