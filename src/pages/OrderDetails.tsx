import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, User, Calendar, CreditCard, Package, Plus, Search, X, Trash2, Minus } from 'lucide-react';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';
import type { OrderDetailsResponse } from '../types/order';
import { VariantSelectionModal } from '../components/POS/VariantSelectionModal';
import type { Product } from '../types/pos';

export const OrderDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const queryClient = useQueryClient();

    // Add Product State
    const [showAddProduct, setShowAddProduct] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<Product[]>([]);
    const [showVariantModal, setShowVariantModal] = React.useState(false);
    const [selectedProductForVariant, setSelectedProductForVariant] = React.useState<Product | null>(null);

    // Fetch Products for Search
    React.useEffect(() => {
        const fetchProducts = async () => {
            if (!searchTerm || searchTerm.length < 2) {
                setSearchResults([]);
                return;
            }
            try {
                const url = new URL(endpoints.products.all);
                url.searchParams.append('search', searchTerm);
                url.searchParams.append('limit', '10');
                const response = await fetch(url.toString(), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data?.data?.data) {
                    setSearchResults(data.data.data);
                }
            } catch (error) {
                console.error('Error searching products:', error);
            }
        };

        const timeoutId = setTimeout(fetchProducts, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, token]);

    const addProductMutation = useMutation({
        mutationFn: async (payload: { product_id: number; quantity: number; product_sku_id: number | null; price: string }) => {
            const response = await fetch(endpoints.orders.addProduct(id!), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Failed to add product');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', id] });
            setShowAddProduct(false);
            setSearchTerm('');
            setSearchResults([]);
            alert('Product added successfully');
        },
        onError: (error) => {
            alert('Failed to add product: ' + error.message);
        }
    });

    const handleProductSelect = (product: Product) => {
        if (product.skus && product.skus.length > 1) {
            setSelectedProductForVariant(product);
            setShowVariantModal(true);
        } else if (product.skus && product.skus.length === 1) {
            const sku = product.skus[0];
            addProductMutation.mutate({
                product_id: product.id,
                quantity: 1,
                product_sku_id: sku.id,
                price: sku.price
            });
        } else {
            // Fallback for simple products (if any) or handle error
            // Assuming structure matches POS where product_sku_id might be null for simple products, 
            // but user request implies sku usage. sending null as per POS fallback logic but adhering to payload structure requested.
            // If simple product logic is needed:
            addProductMutation.mutate({
                product_id: product.id,
                quantity: 1,
                product_sku_id: null,
                price: product.price // Assuming product has price field
            });
        }
    };

    const handleVariantConfirm = (skuId: number, _desc: string, price: string) => {
        if (!selectedProductForVariant) return;
        addProductMutation.mutate({
            product_id: selectedProductForVariant.id,
            quantity: 1,
            product_sku_id: skuId,
            price: price
        });
        setShowVariantModal(false);
        setSelectedProductForVariant(null);
    };

    const removeProductMutation = useMutation({
        mutationFn: async (productId: number) => {
            const response = await fetch(endpoints.orders.removeProduct(id!, productId), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to remove product');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', id] });
            alert('Product removed successfully');
        },
        onError: (error) => {
            alert('Failed to remove product: ' + error.message);
        }
    });

    const handleRemoveProduct = (productId: number) => {
        if (window.confirm('Are you sure you want to remove this item from the order?')) {
            removeProductMutation.mutate(productId);
        }
    };

    const updateQuantityMutation = useMutation({
        mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
            const response = await fetch(endpoints.orders.updateQuantity(id!, productId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantity })
            });
            if (!response.ok) throw new Error('Failed to update quantity');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', id] });
        },
        onError: (error) => {
            alert('Failed to update quantity: ' + error.message);
        }
    });

    const handleUpdateQuantity = (productId: number, newQuantity: number) => {
        if (newQuantity < 1) return;
        updateQuantityMutation.mutate({ productId, quantity: newQuantity });
    };

    const updateStatusMutation = useMutation({
        mutationFn: async (status: number) => {
            const response = await fetch(endpoints.orders.updateStatus(id!), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (!response.ok) throw new Error('Failed to update status');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', id] });
        },
        onError: (error) => {
            alert('Failed to update status: ' + error.message);
        }
    });

    const handleStatusChange = (newStatus: string) => {
        const statusCode = parseInt(newStatus);
        if (!isNaN(statusCode)) {
            updateStatusMutation.mutate(statusCode);
        }
    };

    const { data: apiResponse, isLoading, isError } = useQuery({
        queryKey: ['order', id],
        queryFn: async () => {
            const response = await fetch(endpoints.orders.getById(id!), {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch order details');
            return response.json() as Promise<OrderDetailsResponse>;
        },
        enabled: !!id && !!token,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (isError || !apiResponse?.success) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-4">Error loading order details.</p>
                <button
                    onClick={() => navigate('/orders')}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                >
                    Back to Orders
                </button>
            </div>
        );
    }

    const { order, user, shipping_address, order_items, payments } = apiResponse.data;

    const getStatusColor = (status: number) => {
        switch (Number(status)) {
            case 1: return 'bg-green-100 text-green-800'; // Completed
            case 0: return 'bg-blue-100 text-blue-800';   // Processing
            case 3: return 'bg-red-100 text-red-800';     // Cancelled
            case 2: return 'bg-yellow-100 text-yellow-800'; // On Hold
            case 4: return 'bg-gray-100 text-gray-800';   // Refunded
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/orders')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            Order #{order.invoice_code}
                            <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={updateStatusMutation.isPending}
                                className={`appearance-none rounded-full px-3 py-1 text-sm font-medium border-0 focus:ring-2 focus:ring-primary-500 cursor-pointer ${getStatusColor(Number(order.status))}`}
                                style={{ paddingRight: '1.5rem' }}
                            >
                                <option value={0}>Processing</option>
                                <option value={1}>Completed</option>
                                <option value={2}>On Hold</option>
                                <option value={3}>Cancelled</option>
                                <option value={4}>Refunded</option>
                            </select>
                        </h1>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            {order.created_at}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Items & Payment */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Package className="h-5 w-5 text-gray-400" />
                                Order Items
                            </h2>
                            {!showAddProduct ? (
                                <button
                                    onClick={() => setShowAddProduct(true)}
                                    className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                >
                                    <Plus className="h-4 w-4" /> Add Item
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setShowAddProduct(false);
                                        setSearchTerm('');
                                    }}
                                    className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                                >
                                    <X className="h-4 w-4" /> Cancel
                                </button>
                            )}
                        </div>
                        {showAddProduct && (
                            <div className="p-4 bg-gray-50 border-b border-gray-100 relative">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search products to add..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500"
                                        autoFocus
                                    />
                                </div>
                                {searchTerm.length >= 2 && searchResults.length > 0 && (
                                    <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-10">
                                        {searchResults.map((product) => (
                                            <button
                                                key={product.id}
                                                onClick={() => handleProductSelect(product)}
                                                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-0"
                                            >
                                                <div className="h-8 w-8 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                                                    {product.primary_image ? (
                                                        <img src={product.primary_image} alt={product.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full bg-gray-200" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {product.skus?.length ? `${product.skus.length} Variants` : `৳${product.price}`}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="divide-y divide-gray-200">
                            {order_items.map((item) => (
                                <div key={item.product_id} className="p-6 flex gap-4">
                                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                                        {item.image ? (
                                            <img
                                                src={item.image.image_url}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                <Package className="h-8 w-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between">
                                                <h3 className="text-sm font-medium text-gray-900">
                                                    {item.name}
                                                </h3>
                                                <p className="text-sm font-medium text-gray-900">
                                                    ৳{item.price}
                                                </p>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {item.attributes_text || 'Standard'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500">Qty:</span>
                                                <div className="flex items-center gap-1 border border-gray-300 rounded-lg">
                                                    <button
                                                        onClick={() => handleUpdateQuantity(item.product_id, parseInt(item.quantity) - 1)}
                                                        disabled={parseInt(item.quantity) <= 1 || updateQuantityMutation.isPending}
                                                        className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <Minus className="h-3 w-3 text-gray-600" />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (val > 0) handleUpdateQuantity(item.product_id, val);
                                                        }}
                                                        className="w-12 text-center border-0 focus:ring-0 text-sm py-0.5"
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateQuantity(item.product_id, parseInt(item.quantity) + 1)}
                                                        disabled={updateQuantityMutation.isPending}
                                                        className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <Plus className="h-3 w-3 text-gray-600" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <p className="font-medium text-gray-900">
                                                    Total: ৳{parseFloat(item.price) * parseInt(item.quantity)}
                                                </p>
                                                <button
                                                    onClick={() => handleRemoveProduct(item.product_id)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Remove from order"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-gray-400" />
                                Payment Information
                            </h2>
                        </div>
                        <div className="p-6">
                            {payments.length > 0 ? (
                                <div className="space-y-4">
                                    {payments.map((payment) => (
                                        <div key={payment.payment_id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    Payment Type: {payment.payment_type === "1" ? "Cash" : "Digital"}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Status: {payment.status === "1" ? "Paid" : "Pending"}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gray-900">৳{payment.amount}</p>
                                                <p className="text-xs text-gray-500">
                                                    Paid: ৳{payment.paid_amount}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No payment records found.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Customer & Summary */}
                <div className="space-y-6">
                    {/* Customer Details */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <User className="h-5 w-5 text-gray-400" />
                                Customer Details
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Name</p>
                                <p className="text-sm text-gray-900 font-medium">{user.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Email</p>
                                <p className="text-sm text-gray-900">{user.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Phone</p>
                                <p className="text-sm text-gray-900">{user.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-gray-400" />
                                Shipping Address
                            </h2>
                        </div>
                        <div className="p-6">
                            {shipping_address ? (
                                <address className="text-sm text-gray-600 not-italic leading-relaxed">
                                    <span className="font-medium text-gray-900">
                                        {shipping_address.f_name} {shipping_address.l_name}
                                    </span><br />
                                    {shipping_address.phone}<br />
                                    {shipping_address.address}<br />
                                    {shipping_address.city}, {shipping_address.zip}
                                </address>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No shipping address provided.</p>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>৳{order.item_subtotal}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Shipping</span>
                                <span>৳{order.shipping_charge}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Discount</span>
                                <span className="text-green-600">-৳{order.discount}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-gray-900">
                                <span className="font-semibold">Total</span>
                                <span className="text-xl font-bold">৳{order.total_amount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Variant Modal */}
            <VariantSelectionModal
                isOpen={showVariantModal}
                onClose={() => {
                    setShowVariantModal(false);
                    setSelectedProductForVariant(null);
                }}
                product={selectedProductForVariant}
                onConfirm={handleVariantConfirm}
            />
        </div>
    );
};
