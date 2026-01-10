import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../config';
import { DataTable, type Column } from '../components/DataTable';
import { Plus, Search, Star, MessageSquare, X, Check, ChevronsUpDown, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/apiClient';

interface Rating {
    id: number;
    star: number | string;
    rating: string | null;
    status: number | string;
    product: {
        id: number;
        name: string;
        image: string | null;
    } | null;
    user: {
        name: string;
        email: string;
        phone: string;
    } | null;
}

interface Product {
    id: number;
    name: string;
    price: string;
    image: string | null;
}

interface CreateRatingForm {
    star: number;
    rating: string;
    product_id: number | null;
}

export const Ratings = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const [statusFilter] = useState<number | ''>('');
    const [starFilter] = useState<number | ''>('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState<CreateRatingForm>({
        star: 5,
        rating: '',
        product_id: null
    });

    // Product Search State
    const [productSearch, setProductSearch] = useState('');
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Fetch Ratings
    const { data: ratingsData, isLoading, isError, error } = useQuery({
        queryKey: ['ratings', page, statusFilter, starFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: String(page),
                limit: '10'
            });
            if (statusFilter !== '') params.append('status', String(statusFilter));
            if (starFilter !== '') params.append('star', String(starFilter));

            const response = await fetchWithAuth(`${endpoints.ratings.all}?${params}`);
            return response.json();
        }
    });

    // Fetch Products for dropdown
    const { data: productsData } = useQuery({
        queryKey: ['products', 'search', productSearch],
        queryFn: async () => {
            const response = await fetchWithAuth(endpoints.products.all);
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
        enabled: isCreateModalOpen
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: async (newRating: CreateRatingForm) => {
            const response = await fetchWithAuth(endpoints.ratings.create, {
                method: 'POST',
                body: JSON.stringify({
                    ...newRating,
                    user_id: user?.id
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create rating');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ratings'] });
            setIsCreateModalOpen(false);
            setFormData({ star: 5, rating: '', product_id: null });
            setSelectedProduct(null);
            alert('Rating created successfully');
        },
        onError: (error) => alert(error.message)
    });

    // Toggle Status Mutation
    const toggleStatusMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetchWithAuth(endpoints.ratings.toggleStatus(id), {
                method: 'PATCH',
            });
            if (!response.ok) throw new Error('Failed to toggle status');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ratings'] });
        },
        onError: (error) => alert(error.message)
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetchWithAuth(endpoints.ratings.delete(id), {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete rating');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ratings'] });
            alert('Rating deleted successfully');
        },
        onError: (error) => alert(error.message)
    });

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        setFormData(prev => ({ ...prev, product_id: product.id }));
        setIsProductDropdownOpen(false);
    };

    const columns: Column<Rating>[] = [
        {
            header: 'User',
            render: (rating) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">{rating.user?.name || 'Unknown User'}</div>
                    <div className="text-xs text-gray-500">{rating.user?.email}</div>
                </div>
            )
        },
        {
            header: 'Product',
            render: (rating) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-100 overflow-hidden">
                        {rating.product?.image && (
                            <img src={rating.product.image} alt="" className="h-full w-full object-cover" />
                        )}
                    </div>
                    <div className="text-sm text-gray-900">{rating.product?.name || 'Unknown Product'}</div>
                </div>
            )
        },
        {
            header: 'Rating',
            render: (rating) => (
                <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-900">{rating.star}</span>
                </div>
            )
        },
        {
            header: 'Review',
            className: 'max-w-xs truncate',
            render: (rating) => (
                <div className="flex items-start gap-2 max-w-xs" title={rating.rating || ''}>
                    <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 truncate">{rating.rating || '-'}</span>
                </div>
            )
        },
        {
            header: 'Status',
            render: (rating) => {
                const isActive = Number(rating.status) === 1;
                return (
                    <button
                        onClick={() => toggleStatusMutation.mutate(rating.id)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors ${isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                    >
                        {isActive ? 'Active' : 'Hidden'}
                    </button>
                );
            }
        },
        {
            header: 'Actions',
            className: 'text-right',
            render: (rating) => (
                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this rating?')) {
                                deleteMutation.mutate(rating.id);
                            }
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Delete Rating"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            )
        }
    ];

    const inputClasses = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm";
    const labelClasses = "block text-sm font-medium text-gray-700";

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Ratings & Reviews</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Create Review
                </button>
            </div>

            {isError ? (
                <div className="rounded-xl bg-red-50 p-6 border border-red-200 text-center text-red-700">
                    <h3 className="font-semibold">Failed to load ratings</h3>
                    <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={ratingsData?.data || []}
                    isLoading={isLoading}
                    pagination={{
                        currentPage: ratingsData?.pagination?.current_page || 1,
                        totalPages: ratingsData?.pagination?.total_pages || 1,
                        onPageChange: setPage,
                        totalItems: ratingsData?.pagination?.total_rows
                    }}
                />
            )}

            {/* Create Modal */}
            {isCreateModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-white rounded-xl shadow-lg ring-1 ring-gray-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Create New Review</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
                                {/* Product Select */}
                                <div className="space-y-1">
                                    <label className={labelClasses}>Product</label>
                                    <div className="relative">
                                        <div
                                            className="min-h-[42px] w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm bg-white cursor-text flex items-center gap-2"
                                            onClick={() => setIsProductDropdownOpen(true)}
                                        >
                                            {selectedProduct ? (
                                                <span className="flex items-center text-gray-900">
                                                    {selectedProduct.name}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setSelectedProduct(null); setFormData(prev => ({ ...prev, product_id: null })); }}
                                                        className="ml-2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">Select a product...</span>
                                            )}
                                            <input
                                                type="text"
                                                className="flex-1 outline-none min-w-[50px] bg-transparent"
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
                                                            className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer ${selectedProduct?.id === product.id ? 'bg-primary-50' : ''}`}
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
                                                            {selectedProduct?.id === product.id && (
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
                                </div>

                                {/* Star Rating */}
                                <div className="space-y-1">
                                    <label className={labelClasses}>Star Rating</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, star }))}
                                                className="focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <Star className={`h-8 w-8 ${formData.star >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Review Text */}
                                <div className="space-y-1">
                                    <label className={labelClasses}>Review Text</label>
                                    <textarea
                                        rows={4}
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                        className={inputClasses}
                                        placeholder="Share your experience..."
                                    />
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
                                        disabled={createMutation.isPending || !formData.product_id}
                                        className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                    >
                                        {createMutation.isPending ? 'Saving...' : 'Submit Review'}
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
