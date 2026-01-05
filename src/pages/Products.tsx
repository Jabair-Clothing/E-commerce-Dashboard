import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Product {
    id: number;
    name: string;
    slug: string;
    price: string;
    is_active: boolean;
    category: {
        id: number;
        name: string;
    };
    parent_category: {
        id: number;
        name: string;
    };
    primary_image: string | null;
    stock_quantity: number;
}

interface ApiResponse {
    success: boolean;
    data: {
        data: Product[];
        current_page: number;
        last_page: number;
        total: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
}

export const Products: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    // Fetch Products
    const { data: apiResponse, isPending: isLoading } = useQuery({
        queryKey: ['products', page, searchTerm],
        queryFn: async () => {
            const url = new URL(endpoints.products.all);
            url.searchParams.append('page', page.toString());
            if (searchTerm) {
                url.searchParams.append('search', searchTerm);
            }
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };
            const response = await fetch(url.toString(), { headers });
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json() as Promise<ApiResponse>;
        },
        placeholderData: keepPreviousData,
        staleTime: 5000, // 5 seconds
        enabled: !!token,
    });

    const products = apiResponse?.data.data || [];
    const totalPages = apiResponse?.data.last_page || 1;
    const totalItems = apiResponse?.data.total || 0;

    // Delete Product
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const url = endpoints.products.delete(id);
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };
            const response = await fetch(url, { method: 'DELETE', headers });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            alert('Product deleted successfully');
        },
        onError: () => {
            alert('Failed to delete product');
        }
    });

    const handleDeleteProduct = (id: number) => {
        if (confirm('Are you sure you want to delete this product?')) {
            deleteMutation.mutate(id);
        }
    };

    // Toggle Status
    const statusMutation = useMutation({
        mutationFn: async (id: number) => {
            const url = endpoints.products.updateStatus(id);
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };
            const response = await fetch(url, { method: 'PATCH', headers });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: () => {
            alert('Failed to update status');
        }
    });

    const handleStatusToggle = (id: number) => {
        statusMutation.mutate(id);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                <button
                    onClick={() => navigate('/products/new')}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Add Product
                </button>
            </div>

            <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1); // Reset to page 1 on search
                            }}
                            className="block w-full rounded-lg border-gray-300 pl-10 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 sm:w-80 sm:text-sm transition-all shadow-sm hover:border-gray-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">No products found</td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {product.primary_image ? (
                                                <img
                                                    src={product.primary_image}
                                                    alt={product.name}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                    <Search className="h-5 w-5" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{product.category?.name || 'Uncategorized'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">৳{product.price}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{product.stock_quantity} units</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleStatusToggle(product.id)}
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors ${product.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                                            >
                                                {product.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/products/${product.id}`)}
                                                    className="text-gray-400 hover:text-primary-600 transition-colors"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
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
                <div className="border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <p>Showing {products.length} of {totalItems} results</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                className="disabled:opacity-50 hover:text-gray-900"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages}
                                className="disabled:opacity-50 hover:text-gray-900"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
