import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Search, Mail, MessageSquare } from 'lucide-react';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';

interface Contact {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
    updated_at: string;
}

export const Contacts: React.FC = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: contacts, isLoading, error } = useQuery({
        queryKey: ['contacts'],
        queryFn: async () => {
            const response = await fetch(endpoints.contacts.all, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch contacts');
            const result = await response.json();
            return result.data as Contact[];
        },
        enabled: !!token
    });

    const deleteContactMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(endpoints.contacts.delete(id), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete contact');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        },
        onError: (error) => {
            alert('Error deleting contact: ' + error.message);
        }
    });

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this contact message?')) {
            deleteContactMutation.mutate(id);
        }
    };

    const filteredContacts = contacts?.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
                Error loading contacts: {error.message}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-lg border-gray-300 pl-10 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 sm:w-80 sm:text-sm transition-all shadow-sm hover:border-gray-400"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date/Time</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Sender</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Subject</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Message</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredContacts?.map((contact) => (
                                <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(contact.created_at).toLocaleDateString()}
                                        <div className="text-xs">{new Date(contact.created_at).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold mr-3">
                                                {contact.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {contact.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {contact.subject}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={contact.message}>
                                        {contact.message}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDelete(contact.id)}
                                            className="text-red-600 hover:text-red-900 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                            title="Delete Message"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredContacts?.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <MessageSquare className="h-12 w-12 text-gray-300 mb-2" />
                                            <p>No messages found matching your search.</p>
                                        </div>
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
