import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, Mail, Phone, Calendar, ShoppingBag, CreditCard, DollarSign, Pencil, Trash2, X, Plus, Heart } from 'lucide-react';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/apiClient';

interface ShippingAddress {
    id: number;
    f_name: string;
    l_name: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
}

interface ClientDetails {
    user: {
        id: number;
        name: string;
        email: string;
        phone: string;
        created_at: string;
        address: string | null;
    };
    shipping_addresses: ShippingAddress[];
    order_summary: {
        total_orders: number;
        total_spend: number;
    };
    payment_summary: {
        due_amount: number;
    };
    wishlist: {
        count: number;
        products: {
            wishlist_id: number;
            product_id: number;
            product_name: string;
            product_image: string | null;
        }[];
    };
}

export const ClientDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        f_name: '',
        l_name: '',
        phone: '',
        address: '',
        city: '',
        zip: ''
    });

    const { data: responseData, isLoading, error } = useQuery({
        queryKey: ['client', id],
        queryFn: async () => {
            const response = await fetchWithAuth(endpoints.clients.details(id!));
            return response.json();
        },
        enabled: !!token && !!id
    });

    const deleteAddressMutation = useMutation({
        mutationFn: async (addressId: number) => {
            const response = await fetchWithAuth(endpoints.shippingAddresses.delete(addressId), {
                method: 'DELETE', // Assuming DELETE method based on standard REST, verify if API uses POST for delete if unsure
            });
            // If response is not ok, throw error. Some APIs return 200 with success: false
            if (!response.ok) throw new Error('Failed to delete address');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            alert('Address deleted successfully');
        },
        onError: (err: any) => {
            alert(err.message || 'Failed to delete address');
        }
    });

    const createAddressMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetchWithAuth(endpoints.shippingAddresses.create, {
                method: 'POST',
                body: JSON.stringify({ ...data, User_id: id })
            });
            if (!response.ok) throw new Error('Failed to create address');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            closeModal();
            alert('Address added successfully');
        },
        onError: (err: any) => {
            alert(err.message || 'Failed to create address');
        }
    });

    const updateAddressMutation = useMutation({
        mutationFn: async (data: any) => {
            if (!editingId) return;
            const response = await fetchWithAuth(endpoints.shippingAddresses.update(editingId), {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update address');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            closeModal();
            alert('Address updated successfully');
        },
        onError: (err: any) => {
            alert(err.message || 'Failed to update address');
        }
    });

    const openAddModal = () => {
        setFormData({
            f_name: '',
            l_name: '',
            phone: '',
            address: '',
            city: '',
            zip: ''
        });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (addr: ShippingAddress) => {
        setFormData({
            f_name: addr.f_name,
            l_name: addr.l_name,
            phone: addr.phone,
            address: addr.address,
            city: addr.city,
            zip: addr.zip
        });
        setEditingId(addr.id);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
            f_name: '',
            l_name: '',
            phone: '',
            address: '',
            city: '',
            zip: ''
        });
    };

    const handleDeleteClick = (addrId: number) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            deleteAddressMutation.mutate(addrId);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateAddressMutation.mutate(formData);
        } else {
            createAddressMutation.mutate(formData);
        }
    };

    const clientData: ClientDetails = responseData?.data?.[0]; // Accessing the first item of the data array as per API response

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
    }

    if (error || !clientData) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500 mb-4">Failed to load client details.</p>
                <button onClick={() => navigate('/clients')} className="text-primary-600 hover:underline">Back to Clients</button>
            </div>
        );
    }

    const { user, shipping_addresses, order_summary, payment_summary } = clientData;

    return (
        <div className="space-y-6 max-w-7xl mx-auto relative">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/clients')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                    <p className="text-sm text-gray-500">Client ID: #{user.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - User Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Info</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-600">
                                <Mail className="h-5 w-5 text-gray-400" />
                                <span className="text-sm">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <Phone className="h-5 w-5 text-gray-400" />
                                <span className="text-sm">{user.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <span className="text-sm">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                                <div className="flex items-center gap-3">
                                    <ShoppingBag className="h-8 w-8 text-blue-600" />
                                    <div>
                                        <p className="text-sm text-blue-600 font-medium">Total Orders</p>
                                        <p className="text-2xl font-bold text-blue-900">{order_summary.total_orders}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                                <div className="flex items-center gap-3">
                                    <DollarSign className="h-8 w-8 text-purple-600" />
                                    <div>
                                        <p className="text-sm text-purple-600 font-medium">Total Spend</p>
                                        <p className="text-2xl font-bold text-purple-900">৳{order_summary.total_spend}</p>
                                    </div>
                                </div>
                            </div>
                            <div className={`p-4 rounded-lg border ${payment_summary.due_amount > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                <div className="flex items-center gap-3">
                                    <CreditCard className={`h-8 w-8 ${payment_summary.due_amount > 0 ? 'text-red-600' : 'text-green-600'}`} />
                                    <div>
                                        <p className={`text-sm font-medium ${payment_summary.due_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>Due Amount</p>
                                        <p className={`text-2xl font-bold ${payment_summary.due_amount > 0 ? 'text-red-900' : 'text-green-900'}`}>৳{payment_summary.due_amount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Addresses */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Shipping Addresses */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-gray-500" />
                                Shipping Addresses
                            </h2>
                            <button
                                onClick={openAddModal}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                            >
                                <Plus className="h-4 w-4" />
                                Add Address
                            </button>
                        </div>
                        {shipping_addresses.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">No shipping addresses found.</p>
                                <button onClick={openAddModal} className="mt-2 text-primary-600 text-sm font-medium hover:underline">Add one now</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {shipping_addresses.map(addr => (
                                    <div key={addr.id} className="border rounded-lg p-4 group hover:border-primary-300 transition-all relative bg-white">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <button
                                                onClick={() => openEditModal(addr)}
                                                className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                                                title="Edit Address"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(addr.id)}
                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                title="Delete Address"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="font-medium text-gray-900 mb-1 pr-16">{addr.f_name} {addr.l_name}</div>
                                        <div className="text-sm text-gray-600">{addr.phone}</div>
                                        <div className="text-sm text-gray-600 mt-2">{addr.address}</div>
                                        <div className="text-sm text-gray-600">{addr.city}, {addr.zip}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Wishlist Section */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Heart className="h-5 w-5 text-gray-500" />
                                Wishlist
                                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {clientData.wishlist?.count || 0}
                                </span>
                            </h2>
                        </div>
                        {(!clientData.wishlist?.products || clientData.wishlist.products.length === 0) ? (
                            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <Heart className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">No items in wishlist.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {clientData.wishlist.products.map((item) => (
                                    <div key={item.wishlist_id} className="flex items-center gap-3 p-3 border rounded-lg hover:border-pink-200 hover:bg-pink-50/30 transition-colors group">
                                        <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                            {item.product_image ? (
                                                <img src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                    <ShoppingBag className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 truncate" title={item.product_name}>
                                                {item.product_name}
                                            </p>
                                            <p className="text-xs text-gray-500">ID: #{item.product_id}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Address Modal (Add/Edit) */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingId ? 'Edit Address' : 'Add New Address'}
                            </h3>
                            <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-full">
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        value={formData.f_name}
                                        onChange={e => setFormData({ ...formData, f_name: e.target.value })}
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        value={formData.l_name}
                                        onChange={e => setFormData({ ...formData, l_name: e.target.value })}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="017..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="House, Road, Area"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="Dhaka"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        value={formData.zip}
                                        onChange={e => setFormData({ ...formData, zip: e.target.value })}
                                        placeholder="1200"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateAddressMutation.isPending || createAddressMutation.isPending}
                                    className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {(updateAddressMutation.isPending || createAddressMutation.isPending) ? 'Saving...' : (editingId ? 'Update Address' : 'Add Address')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
