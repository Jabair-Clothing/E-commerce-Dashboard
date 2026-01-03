import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, X, Check, ChevronsUpDown, Edit } from 'lucide-react';
import { createPortal } from 'react-dom';
import { endpoints } from '../config';

interface Product {
    id: number;
    name: string;
    price: string;
    image: string | null;
}

interface Coupon {
    id: number;
    code: string;
    amount: number;
    type: 'flat' | 'percent';
    is_global: boolean;
    min_pur: number | null;
    max_usage: number | null;
    max_usage_per_user: number | null;
    start_date: string | null;
    end_date: string | null;
    status: number;
    products?: { id: number; name: string }[];
    items?: { id: number; name: string }[]; // Keep for backward compatibility or if backend still sends it
    total_orders?: number;
    total_sales?: number;
}

interface CreateCouponForm {
    code: string;
    amount: string;
    type: 'flat' | 'percent';
    is_global: boolean;
    min_pur: string;
    max_usage: string;
    max_usage_per_user: string;
    start_date: string;
    end_date: string;
    product_ids: number[];
}

export const Coupons = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState<CreateCouponForm>({
        code: '',
        amount: '',
        type: 'flat',
        is_global: false,
        min_pur: '',
        max_usage: '',
        max_usage_per_user: '',
        start_date: '',
        end_date: '',
        product_ids: []
    });

    // Product Search State
    const [productSearch, setProductSearch] = useState('');
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [viewItems, setViewItems] = useState<{ id: number; name: string }[] | null>(null);
    const [editId, setEditId] = useState<number | null>(null);

    // Fetch Coupons
    const { data: couponsData, isLoading, isError, error } = useQuery({
        queryKey: ['coupons', page, search],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: String(page),
                limit: '10',
                search
            });
            const response = await fetch(`${endpoints.coupons.all}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        }
    });

    // Fetch Products for dropdown
    const { data: productsData } = useQuery({
        queryKey: ['products', 'search', productSearch],
        queryFn: async () => {
            const response = await fetch(endpoints.products.all, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();
            const productsList = data.data?.data || [];
            if (productSearch) {
                return productsList.filter((p: Product) =>
                    p.name.toLowerCase().includes(productSearch.toLowerCase())
                );
            }
            return productsList;
        },
        enabled: !formData.is_global // Fetch whenever specific items are needed
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (newCoupon: CreateCouponForm) => {
            const response = await fetch(endpoints.coupons.create, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...newCoupon,
                    amount: Number(newCoupon.amount),
                    min_pur: newCoupon.min_pur ? Number(newCoupon.min_pur) : null,
                    max_usage: newCoupon.max_usage ? Number(newCoupon.max_usage) : null,
                    max_usage_per_user: newCoupon.max_usage_per_user ? Number(newCoupon.max_usage_per_user) : null,
                    product_ids: newCoupon.is_global ? [] : newCoupon.product_ids
                })
            });
            if (!response.ok) {
                const errorlimit = await response.json();
                throw new Error(errorlimit.message || 'Failed to create coupon');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
            setIsCreateModalOpen(false);
            resetForm();
            alert('Coupon created successfully');
        },
        onError: (error) => {
            alert(error.message);
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (data: CreateCouponForm) => {
            if (!editId) throw new Error('No edit ID');
            const response = await fetch(endpoints.coupons.update(editId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    code: data.code,
                    amount: Number(data.amount),
                    type: data.type,
                    is_global: data.is_global,
                    min_pur: data.min_pur ? Number(data.min_pur) : null,
                    max_usage: data.max_usage ? Number(data.max_usage) : null,
                    max_usage_per_user: data.max_usage_per_user ? Number(data.max_usage_per_user) : null,
                    start_date: data.start_date,
                    end_date: data.end_date,
                    product_ids: data.is_global ? [] : data.product_ids
                })
            });
            if (!response.ok) throw new Error('Failed to update coupon');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
            setIsCreateModalOpen(false);
            resetForm();
            alert('Coupon updated successfully');
        },
        onError: (error) => alert(error.message)
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(endpoints.coupons.toggleStatus(id), {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to toggle status');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
        },
        onError: (error) => alert(error.message)
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(endpoints.coupons.delete(id), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to delete coupon');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
            alert('Coupon deleted successfully');
        },
        onError: (error) => alert(error.message)
    });

    const resetForm = () => {
        setFormData({
            code: '',
            amount: '',
            type: 'flat',
            is_global: false,
            min_pur: '',
            max_usage: '',
            max_usage_per_user: '',
            start_date: '',
            end_date: '',
            product_ids: []
        });
        setSelectedProducts([]);
        setEditId(null);
        setSelectedProducts([]);
        setProductSearch('');
    };

    const handleProductSelect = (product: Product) => {
        if (selectedProducts.find(p => p.id === product.id)) {
            // Remove
            setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
            setFormData(prev => ({ ...prev, product_ids: prev.product_ids.filter(id => id !== product.id) }));
        } else {
            // Add
            setSelectedProducts(prev => [...prev, product]);
            setFormData(prev => ({ ...prev, product_ids: [...prev.product_ids, product.id] }));
        }
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editId) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const inputClasses = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm";
    const labelClasses = "block text-sm font-medium text-gray-700";

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Create Coupon
                </button>
            </div>

            {isError ? (
                <div className="rounded-xl bg-red-50 p-6 border border-red-200 text-center">
                    <div className="flex flex-col items-center gap-2 text-red-700">
                        <X className="h-8 w-8 text-red-500" />
                        <h3 className="text-lg font-semibold">Failed to load coupons</h3>
                        <p className="text-sm">{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
                        <p className="text-xs text-red-500 mt-2 max-w-lg mx-auto">
                            If you recently updated the backend, please check that the <code>CouponController::index</code> method relies on the <code>products</code> relationship instead of <code>items</code>.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
                    <div className="border-b border-gray-200 p-4">
                        <div className="relative max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search coupons..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Loading coupons...</td>
                                    </tr>
                                ) : couponsData?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No coupons found</td>
                                    </tr>
                                ) : (
                                    couponsData?.data?.map((coupon: Coupon) => (
                                        <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                                                <div className="text-xs text-gray-500">
                                                    {coupon.start_date} - {coupon.end_date}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {coupon.type === 'flat' ? '৳' : ''}{coupon.amount}{coupon.type === 'percent' ? '%' : ''}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {coupon.is_global ? (
                                                        <span className="text-gray-900">Global</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => setViewItems(coupon.products || coupon.items || [])}
                                                            className="text-primary-600 hover:text-primary-800 hover:underline font-medium focus:outline-none"
                                                        >
                                                            Specific Items
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div>Limits: {coupon.max_usage || '∞'} total</div>
                                                <div>Used: {coupon.total_orders || 0} times</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => toggleStatusMutation.mutate(coupon.id)}
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors ${coupon.status === 1 ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                                                >
                                                    {coupon.status === 1 ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditId(coupon.id);
                                                            const associatedItems = coupon.products || coupon.items || [];
                                                            setFormData({
                                                                code: coupon.code,
                                                                amount: String(coupon.amount),
                                                                type: coupon.type,
                                                                is_global: Boolean(coupon.is_global),
                                                                min_pur: coupon.min_pur ? String(coupon.min_pur) : '',
                                                                max_usage: coupon.max_usage ? String(coupon.max_usage) : '',
                                                                max_usage_per_user: coupon.max_usage_per_user ? String(coupon.max_usage_per_user) : '',
                                                                start_date: coupon.start_date || '',
                                                                end_date: coupon.end_date || '',
                                                                product_ids: associatedItems.map(i => i.id)
                                                            });
                                                            const existingProducts = associatedItems.map(i => ({
                                                                id: i.id,
                                                                name: i.name,
                                                                price: '0',
                                                                image: null
                                                            }));
                                                            setSelectedProducts(existingProducts);
                                                            setIsCreateModalOpen(true);
                                                        }}
                                                        className="text-gray-400 hover:text-primary-600 transition-colors"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to delete this coupon?')) {
                                                                deleteMutation.mutate(coupon.id);
                                                            }
                                                        }}
                                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="border-t border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <p>Showing {couponsData?.data?.length || 0} results</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="disabled:opacity-50 hover:text-gray-900"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={!couponsData?.pagination || page === couponsData.pagination.total_pages}
                                    className="disabled:opacity-50 hover:text-gray-900"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Items Modal */}
            {viewItems && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-lg ring-1 ring-gray-200 flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Included Items</h3>
                            <button onClick={() => setViewItems(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            {viewItems.length > 0 ? (
                                <ul className="divide-y divide-gray-100">
                                    {viewItems.map((item, index) => (
                                        <li key={index} className="py-2 text-sm text-gray-700">
                                            {item.name}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">No items specified.</p>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                            <button
                                onClick={() => setViewItems(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Create Modal - Portal */}
            {isCreateModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg ring-1 ring-gray-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">{editId ? 'Edit Coupon' : 'Create New Coupon'}</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className={labelClasses}>Coupon Code</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            className={inputClasses}
                                            placeholder="e.g., SUMMER2024"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelClasses}>Discount Amount</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                className={inputClasses}
                                                placeholder="20"
                                            />
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'flat' | 'percent' })}
                                                className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                                            >
                                                <option value="flat">Flat (৳)</option>
                                                <option value="percent">Percent (%)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className={labelClasses}>Coupon Scope</label>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm ${!formData.is_global ? 'font-semibold text-primary-600' : 'text-gray-500'}`}>Specific Items</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, is_global: !prev.is_global }))}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${formData.is_global ? 'bg-primary-600' : 'bg-gray-200'}`}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.is_global ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                            <span className={`text-sm ${formData.is_global ? 'font-semibold text-primary-600' : 'text-gray-500'}`}>Global</span>
                                        </div>
                                    </div>

                                    {!formData.is_global && (
                                        <div className="relative">
                                            <div
                                                className="min-h-[42px] w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm bg-white cursor-text flex flex-wrap gap-2 items-center"
                                                onClick={() => setIsProductDropdownOpen(true)}
                                            >
                                                {selectedProducts.map(p => (
                                                    <span key={p.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                                                        {p.name}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleProductSelect(p); }}
                                                            className="ml-1 text-primary-600 hover:text-primary-800"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                                <input
                                                    type="text"
                                                    className="flex-1 outline-none min-w-[100px]"
                                                    placeholder={selectedProducts.length === 0 ? "Select products..." : ""}
                                                    value={productSearch}
                                                    onChange={(e) => setProductSearch(e.target.value)}
                                                    onFocus={() => setIsProductDropdownOpen(true)}
                                                />
                                                <ChevronsUpDown className="h-4 w-4 text-gray-400 ml-auto" />
                                            </div>

                                            {isProductDropdownOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setIsProductDropdownOpen(false)} />
                                                    <div className="absolute z-20 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200">
                                                        {productsData?.map((product: Product) => (
                                                            <div
                                                                key={product.id}
                                                                className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer ${selectedProducts.some(p => p.id === product.id) ? 'bg-primary-50' : ''}`}
                                                                onClick={() => handleProductSelect(product)}
                                                            >
                                                                <div className="flex-shrink-0 h-8 w-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                                                                    {product.image ? (
                                                                        <img src={product.image} alt="" className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <Search className="h-4 w-4 text-gray-400" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                                    <div className="text-xs text-gray-500">৳{product.price}</div>
                                                                </div>
                                                                {selectedProducts.some(p => p.id === product.id) && (
                                                                    <Check className="h-4 w-4 text-primary-600" />
                                                                )}
                                                            </div>
                                                        ))}
                                                        {productsData?.length === 0 && (
                                                            <div className="p-4 text-center text-gray-500 text-sm">No products found</div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className={labelClasses}>Min Purchase</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.min_pur}
                                            onChange={(e) => setFormData({ ...formData, min_pur: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelClasses}>Max Usage (Total)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.max_usage}
                                            onChange={(e) => setFormData({ ...formData, max_usage: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelClasses}>Max per User</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.max_usage_per_user}
                                            onChange={(e) => setFormData({ ...formData, max_usage_per_user: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className={labelClasses}>Start Date</label>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelClasses}>End Date</label>
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending}
                                        className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                    >
                                        {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editId ? 'Update Coupon' : 'Create Coupon')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
