import React from 'react';
import { DollarSign, ShoppingBag, Users, Activity } from 'lucide-react';
import { SalesChart } from '../components/SalesChart';
import { cn } from '../utils/cn';

const stats = [
    { label: 'Total Revenue', value: '$54,232', change: '+12.5%', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Orders', value: '1,253', change: '+8.2%', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'New Customers', value: '342', change: '+4.3%', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Active Sessions', value: '12.5k', change: '-2.1%', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-100' },
];

export const Dashboard: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <select className="rounded-lg border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>This Year</option>
                </select>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <div key={index} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div className={cn("rounded-lg p-2", stat.bg)}>
                                <stat.icon className={cn("h-6 w-6", stat.color)} />
                            </div>
                            <span className={cn("text-sm font-medium", stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600')}>
                                {stat.change}
                            </span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
                            <p className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 lg:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
                        <button className="text-sm font-medium text-primary-600 hover:text-primary-700">View Report</button>
                    </div>
                    <SalesChart />
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="h-2 w-2 mt-2 rounded-full bg-primary-500 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-gray-900">New order #345{i} placed</p>
                                    <p className="text-xs text-gray-500">2 minutes ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
