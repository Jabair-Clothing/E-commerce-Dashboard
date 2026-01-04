import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Eye, Loader2, Users } from 'lucide-react';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string | null;
    order_summary: {
        total_orders: number;
        total_spend: number;
    };
    payment_summary: {
        due_amount: number;
    };
}

export const Clients: React.FC = () => {
    const { token } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: clientsData, isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: async () => {
            const response = await fetch(endpoints.clients.all, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch clients');
            return response.json();
        },
        enabled: !!token
    });

    const clients: Client[] = clientsData?.data || [];

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="h-8 w-8 text-primary-600" />
                    Clients
                </h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        className="pl-10 pr-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
            ) : (
                <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 rounded-xl">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Orders</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Spend</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due</th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredClients.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                            No clients found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{client.email}</div>
                                                <div className="text-sm text-gray-500">{client.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {client.order_summary?.total_orders || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                ৳{client.order_summary?.total_spend || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {client.payment_summary?.due_amount > 0 ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        ৳{client.payment_summary.due_amount}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Paid
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link
                                                    to={`/clients/${client.id}`}
                                                    className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1"
                                                >
                                                    <Eye className="h-4 w-4" /> View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
