import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart3, TrendingUp, Users, AlertCircle, Calendar,
    DollarSign, ShoppingBag,
    CreditCard, Percent, Heart
} from 'lucide-react';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';
import { SalesChart } from '../components/SalesChart';
import { cn } from '../utils/cn';

// --- Interfaces ---
interface DashboardOverview {
    cards: {
        total_order_count: number;
        new_order_count: number;
        today_order_count: number;
        total_revenue: number;
        today_revenue: number;
        total_client_count: number;
        due_orders_count: number;
        total_due_amount: number;
    };
    charts: {
        orders_last_7_days: { date: string; orders: number }[];
        revenue_last_7_days: { date: string; revenue: number }[];
        status_distribution: { status: string; count: number }[];
    };
    top_selling_products: any[];
    recent_orders: any[];
}

interface SalesReportItem {
    period: string;
    orders: number;
    revenue: number;
    aov: number;
}

interface ReceivableItem {
    order_id: number;
    invoice_code: string;
    customer: string;
    phone: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    time_ago: string;
}

interface BestSellerItem {
    id: number;
    name: string;
    sold_qty: number;
    sold_amount: number;
}

interface CouponReportItem {
    id: number;
    code: string;
    orders_count: number;
    discount_sum: number;
    sales_sum: number;
}

interface WishlistItem {
    id: number;
    name: string;
    wishlist_count: number;
}

// --- Components ---

const StatCard = ({ label, value, icon: Icon, color, subValue }: { label: string, value: string, icon: any, color: string, subValue?: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
                {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
            </div>
            <div className={`p - 3 rounded - lg ${color} bg - opacity - 10`}>
                <Icon className={`h - 6 w - 6 ${color.replace('bg-', 'text-')} `} />
            </div>
        </div>
    </div>
);

export const Reports: React.FC = () => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Helper to build URL with query params
    const getUrl = (endpoint: string) => {
        const url = new URL(endpoint);
        if (dateRange.start) url.searchParams.append('start_date', dateRange.start);
        if (dateRange.end) url.searchParams.append('end_date', dateRange.end);
        return url.toString();
    };

    // --- Queries for each tab ---
    const overviewQuery = useQuery({
        queryKey: ['reports', 'overview', dateRange],
        queryFn: async () => {
            const res = await fetch(getUrl(endpoints.reports.overview), { headers: { Authorization: `Bearer ${token}` } });
            return (await res.json()).data as DashboardOverview;
        },
        enabled: activeTab === 'overview' && !!token
    });

    const salesQuery = useQuery({
        queryKey: ['reports', 'sales', dateRange],
        queryFn: async () => {
            const res = await fetch(getUrl(endpoints.reports.sales), { headers: { Authorization: `Bearer ${token}` } });
            return (await res.json()).data as SalesReportItem[];
        },
        enabled: activeTab === 'sales' && !!token
    });

    const receivablesQuery = useQuery({
        queryKey: ['reports', 'receivables', dateRange],
        queryFn: async () => {
            const res = await fetch(getUrl(endpoints.reports.receivables), { headers: { Authorization: `Bearer ${token}` } });
            return (await res.json()).data as { count: number, total_due_amount: number, list: ReceivableItem[] };
        },
        enabled: activeTab === 'receivables' && !!token
    });

    const bestSellersQuery = useQuery({
        queryKey: ['reports', 'bestSellers', dateRange],
        queryFn: async () => {
            const res = await fetch(getUrl(endpoints.reports.bestSellers), { headers: { Authorization: `Bearer ${token}` } });
            return (await res.json()).data as BestSellerItem[];
        },
        enabled: activeTab === 'bestSellers' && !!token
    });

    const couponsQuery = useQuery({
        queryKey: ['reports', 'coupons', dateRange],
        queryFn: async () => {
            const res = await fetch(getUrl(endpoints.reports.coupons), { headers: { Authorization: `Bearer ${token}` } });
            return (await res.json()).data as CouponReportItem[];
        },
        enabled: activeTab === 'coupons' && !!token
    });

    const wishlistsQuery = useQuery({
        queryKey: ['reports', 'wishlists'],
        queryFn: async () => {
            const res = await fetch(getUrl(endpoints.reports.wishlists), { headers: { Authorization: `Bearer ${token}` } });
            return (await res.json()).data as WishlistItem[];
        },
        enabled: activeTab === 'wishlists' && !!token
    });

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'sales', label: 'Sales', icon: TrendingUp },
        { id: 'receivables', label: 'Receivables', icon: CreditCard },
        { id: 'bestSellers', label: 'Best Sellers', icon: ShoppingBag },
        { id: 'coupons', label: 'Coupons', icon: Percent },
        { id: 'wishlists', label: 'Wishlists', icon: Heart },
    ];

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="text-sm text-gray-500">Monitor your business performance metrics</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-1.5 rounded-lg shadow-sm border border-gray-200 ring-1 ring-gray-200/50">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200/50 hover:border-gray-300 transition-colors">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <input
                            type="date"
                            className="text-sm bg-transparent border-none focus:ring-0 p-0 text-gray-700 placeholder-gray-400 font-medium cursor-pointer"
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                    </div>
                    <span className="text-gray-400 font-medium">to</span>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200/50 hover:border-gray-300 transition-colors">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <input
                            type="date"
                            className="text-sm bg-transparent border-none focus:ring-0 p-0 text-gray-700 placeholder-gray-400 font-medium cursor-pointer"
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2",
                                activeTab === tab.id
                                    ? "border-primary-500 text-primary-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {overviewQuery.isLoading && <div className="text-center py-10">Loading overview...</div>}
                        {overviewQuery.data && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard label="Total Revenue" value={`৳${overviewQuery.data.cards.total_revenue.toLocaleString()}`} icon={DollarSign} color="text-green-600 bg-green-100" />
                                    <StatCard label="Total Orders" value={overviewQuery.data.cards.total_order_count.toString()} icon={ShoppingBag} color="text-blue-600 bg-blue-100" />
                                    <StatCard label="Due Amount" value={`৳${overviewQuery.data.cards.total_due_amount.toLocaleString()}`} icon={AlertCircle} color="text-red-600 bg-red-100" />
                                    <StatCard label="Total Clients" value={overviewQuery.data.cards.total_client_count.toString()} icon={Users} color="text-purple-600 bg-purple-100" />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend (Last 7 Days)</h3>
                                        <SalesChart data={overviewQuery.data.charts.revenue_last_7_days} />
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Top Selling</h3>
                                        <div className="space-y-4">
                                            {overviewQuery.data.top_selling_products.map((product, idx) => (
                                                <div key={idx} className="flex items-center justify-between pb-2 border-b border-gray-50 last:border-0 pointer-events-none">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                                            <p className="text-xs text-gray-500">{product.sold_qty} sold</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">৳{Number(product.sold_amount).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* SALES TAB */}
                {activeTab === 'sales' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {salesQuery.isLoading && <div className="p-8 text-center text-gray-500">Loading sales data...</div>}
                        {salesQuery.data && (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Period</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Orders</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Revenue</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Avg Value</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {salesQuery.data.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.period}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.orders}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">৳{row.revenue.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">৳{row.aov.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {salesQuery.data.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-500">No sales data found</td></tr>}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* RECEIVABLES TAB */}
                {activeTab === 'receivables' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {receivablesQuery.data && (
                            <div className="p-4 border-b border-gray-200 bg-red-50 flex justify-between items-center">
                                <span className="text-red-800 font-medium">Total Receivables</span>
                                <span className="text-2xl font-bold text-red-600">৳{receivablesQuery.data.total_due_amount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Invoice</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Paid</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Due</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Age</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {receivablesQuery.data?.list.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">{item.invoice_code}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.customer}
                                                <div className="text-xs text-gray-500">{item.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">৳{item.total_amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">৳{item.paid_amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">৳{item.due_amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.time_ago}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* BEST SELLERS TAB */}
                {activeTab === 'bestSellers' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Rank</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Product Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Quantity Sold</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Total Sales Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bestSellersQuery.data?.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400">#{idx + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.sold_qty}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">৳{Number(item.sold_amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* COUPONS & WISHLISTS (Simplified for brevity as they are similar list views) */}
                {activeTab === 'coupons' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4">Coupon Usage Report</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-2">Code</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-2">Orders</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-2">Total Discount</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-2">Total Sales</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {couponsQuery.data?.map(c => (
                                        <tr key={c.id}>
                                            <td className="py-3 text-sm font-medium text-primary-600">{c.code}</td>
                                            <td className="py-3 text-sm text-gray-600">{c.orders_count}</td>
                                            <td className="py-3 text-sm text-gray-600">৳{Number(c.discount_sum).toLocaleString()}</td>
                                            <td className="py-3 text-sm text-gray-600">৳{Number(c.sales_sum).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {couponsQuery.data?.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-gray-500">No coupon usage found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'wishlists' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4">Most Wishlisted Products</h3>
                        <ul className="space-y-3">
                            {wishlistsQuery.data?.map(w => (
                                <li key={w.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-900">{w.name}</span>
                                    <div className="flex items-center gap-2 text-pink-600">
                                        <Heart className="h-4 w-4 fill-pink-600" />
                                        <span className="font-bold">{w.wishlist_count}</span>
                                    </div>
                                </li>
                            ))}
                            {wishlistsQuery.data?.length === 0 && <p className="text-gray-500">No wishlist data available</p>}
                        </ul>
                    </div>
                )}

            </div>
        </div>
    );
};
