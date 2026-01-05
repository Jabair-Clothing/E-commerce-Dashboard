import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';
import type { OrderDetailsResponse } from '../types/order';
import { VariantSelectionModal } from '../components/POS/VariantSelectionModal';
import type { Product } from '../types/pos';
import { OrderHeader } from '../components/OrderDetails/OrderHeader';
import { OrderItemsList } from '../components/OrderDetails/OrderItemsList';
import { PaymentInfo } from '../components/OrderDetails/PaymentInfo';
import { CustomerInfo } from '../components/OrderDetails/CustomerInfo';
import { ShippingAddress } from '../components/OrderDetails/ShippingAddress';
import { OrderSummary } from '../components/OrderDetails/OrderSummary';
import { Invoice } from '../components/OrderDetails/Invoice';

export const OrderDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
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
            addProductMutation.mutate({
                product_id: product.id,
                quantity: 1,
                product_sku_id: null,
                price: product.price
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

    const handlePrintInvoice = () => {
        window.print();
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
            </div>
        );
    }

    const { order, user, shipping_address, order_items, payments } = apiResponse.data;

    return (
        <div className="space-y-6">
            <OrderHeader
                invoiceCode={order.invoice_code}
                status={order.status}
                createdAt={order.created_at}
                onStatusChange={handleStatusChange}
                onPrintInvoice={handlePrintInvoice}
                isUpdating={updateStatusMutation.isPending}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Items & Payment */}
                <div className="lg:col-span-2 space-y-6">
                    <OrderItemsList
                        items={order_items}
                        showAddProduct={showAddProduct}
                        searchTerm={searchTerm}
                        searchResults={searchResults}
                        onToggleAddProduct={() => {
                            setShowAddProduct(!showAddProduct);
                            if (showAddProduct) setSearchTerm('');
                        }}
                        onSearchChange={setSearchTerm}
                        onProductSelect={handleProductSelect}
                        onQuantityUpdate={handleUpdateQuantity}
                        onRemoveItem={handleRemoveProduct}
                        isUpdating={updateQuantityMutation.isPending}
                    />

                    <PaymentInfo payments={payments} orderId={id!} />
                </div>

                {/* Right Column - Customer & Summary */}
                <div className="space-y-6">
                    <CustomerInfo
                        user={user}
                        guestName={order.user_name}
                        guestPhone={order.user_phone}
                    />
                    <ShippingAddress
                        shippingAddress={shipping_address}
                        guestAddress={order.address}
                    />
                    <OrderSummary order={order} />
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

            {/* Invoice for Printing */}
            <Invoice
                order={order}
                user={user}
                shippingAddress={shipping_address}
                orderItems={order_items}
                payments={payments}
            />
        </div>
    );
};
