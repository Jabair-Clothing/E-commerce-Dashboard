import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';
import { POSHeader } from '../components/POS/POSHeader';
import { ProductFilters } from '../components/POS/ProductFilters';
import { ProductGrid } from '../components/POS/ProductGrid';
import { CartList } from '../components/POS/CartList';
import { CheckoutForm } from '../components/POS/CheckoutForm';
import type { Product, CartItem, ParentCategory, Category, OrderInfo } from '../types/pos';

export const POSRefactored: React.FC = () => {
    const { token } = useAuth();

    // --- State ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedParentCategory, setSelectedParentCategory] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);

    // Customer Info
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [paymentType, setPaymentType] = useState<number>(1); // 1: Cash, 2: Bkash
    const [trxId, setTrxId] = useState('');
    const [paymentPhone, setPaymentPhone] = useState('');

    // Client Search
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [showWalkingCustomerModal, setShowWalkingCustomerModal] = useState(false);

    // Address Selection
    const [shippingAddresses, setShippingAddresses] = useState<any[]>([]);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [selectedShippingAddress, setSelectedShippingAddress] = useState<any | null>(null);

    // Variant Selection
    const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
    const [showVariantModal, setShowVariantModal] = useState(false);

    // Shipping
    const [shippingMethod, setShippingMethod] = useState<'pickup' | 'inside' | 'outside'>('pickup');

    // --- Queries ---

    // Fetch Clients
    const { data: clientsData } = useQuery({
        queryKey: ['clients-all'],
        queryFn: async () => {
            const response = await fetch(endpoints.clients.all, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch clients');
            return response.json();
        },
        enabled: !!token
    });
    const clients = clientsData?.data || [];
    const filteredClients = clients.filter((client: any) => {
        if (!clientSearchTerm) return true;
        const search = clientSearchTerm.toLowerCase();
        return (
            client.name.toLowerCase().includes(search) ||
            client.phone.includes(search) ||
            client.email?.toLowerCase().includes(search)
        );
    });

    // Fetch Parent Categories
    const { data: parentsData } = useQuery({
        queryKey: ['pos-parents'],
        queryFn: async () => {
            const response = await fetch(endpoints.categories.parents, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch parent categories');
            return response.json();
        },
        enabled: !!token
    });
    const parents: ParentCategory[] = parentsData?.success ? parentsData.data : [];

    // Fetch Sub Categories
    const { data: categoriesData } = useQuery({
        queryKey: ['pos-categories', selectedParentCategory],
        queryFn: async () => {
            let url = endpoints.categories.all;
            if (selectedParentCategory) {
                url = `${endpoints.categories.parents}/${selectedParentCategory}`;
            }
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch categories');
            return response.json();
        },
        enabled: !!token
    });
    const categories: Category[] = categoriesData?.success
        ? (selectedParentCategory ? categoriesData.data.categories || [] : categoriesData.data)
        : [];

    // Fetch Products
    const { data: productsData, isPending: loadingProducts } = useQuery({
        queryKey: ['pos-products', searchTerm, selectedParentCategory, selectedCategory],
        queryFn: async () => {
            const url = new URL(endpoints.products.all);
            url.searchParams.append('limit', '100');
            if (searchTerm) url.searchParams.append('search', searchTerm);
            if (selectedParentCategory) url.searchParams.append('parent_category_id', selectedParentCategory.toString());
            if (selectedCategory) url.searchParams.append('category_id', selectedCategory.toString());

            const response = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch products');
            return response.json();
        },
        enabled: !!token
    });
    const products: Product[] = productsData?.data?.data || [];

    // Fetch Order Info
    const { data: orderInfoData } = useQuery({
        queryKey: ['orderInfo'],
        queryFn: async () => {
            const response = await fetch(endpoints.orderInfo.get, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch order info');
            const data = await response.json();
            // Cache in localStorage
            localStorage.setItem('pos_order_info', JSON.stringify(data));
            return data;
        },
        enabled: !!token,
        initialData: () => {
            const saved = localStorage.getItem('pos_order_info');
            return saved ? JSON.parse(saved) : undefined;
        }
    });

    const orderInfo: OrderInfo = orderInfoData || { vat: "0", inside_dhaka: 60, outside_dhaka: 120, bkash_changed: "0" };


    // --- Actions ---

    const addToCart = (product: Product) => {
        // If product has multiple SKUs, show selection modal
        if (product.skus && product.skus.length > 1) {
            setSelectedProductForVariant(product);
            setShowVariantModal(true);
            return;
        }

        // If product has exactly one SKU, add it directly
        if (product.skus && product.skus.length === 1) {
            const sku = product.skus[0];
            const description = sku.attributes && sku.attributes.length > 0
                ? sku.attributes.map(a => `${a.attribute_name}: ${a.value_name}`).join(', ')
                : 'Standard';

            setCart(prev => {
                const existing = prev.find(item => item.id === product.id && item.product_sku_id === sku.id);
                if (existing) {
                    return prev.map(item =>
                        item.id === product.id && item.product_sku_id === sku.id
                            ? { ...item, cartQuantity: item.cartQuantity + 1 }
                            : item
                    );
                }
                return [...prev, {
                    ...product,
                    cartQuantity: 1,
                    product_sku_id: sku.id,
                    variant_description: description,
                    variant_price: sku.price,
                    price: sku.price
                }];
            });
            return;
        }

        // Fallback for products with no SKUs (legacy/simple products)
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id && !item.product_sku_id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id && !item.product_sku_id
                        ? { ...item, cartQuantity: item.cartQuantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, cartQuantity: 1, product_sku_id: null }];
        });
    };

    const handleVariantConfirm = (skuId: number, description: string, price: string) => {
        if (!selectedProductForVariant) return;

        setCart(prev => {
            const existing = prev.find(item => item.id === selectedProductForVariant.id && item.product_sku_id === skuId);
            if (existing) {
                return prev.map(item =>
                    item.id === selectedProductForVariant.id && item.product_sku_id === skuId
                        ? { ...item, cartQuantity: item.cartQuantity + 1 }
                        : item
                );
            }
            return [...prev, {
                ...selectedProductForVariant,
                cartQuantity: 1,
                product_sku_id: skuId,
                variant_description: description,
                variant_price: price,
                price: price
            }];
        });
        setSelectedProductForVariant(null);
        setShowVariantModal(false);
    };

    const removeFromCart = (productId: number, productSkuId?: number | null) => {
        setCart(prev => prev.filter(item => !(item.id === productId && item.product_sku_id === (productSkuId || null))));
    };

    const updateQuantity = (productId: number, delta: number, productSkuId?: number | null) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId && item.product_sku_id === (productSkuId || null)) {
                const newQty = Math.max(1, item.cartQuantity + delta);
                if (newQty > item.stock_quantity) return item;
                return { ...item, cartQuantity: newQty };
            }
            return item;
        }));
    };

    const handleParentCategoryChange = (id: number | null) => {
        setSelectedParentCategory(id);
        setSelectedCategory(null);
    };

    const handleSelectClient = async (client: any) => {
        setSelectedClient(client);
        setCustomerName(client.name);
        setCustomerPhone(client.phone);
        setCustomerAddress(client.address || '');
        setShippingAddresses([]);
        setSelectedShippingAddress(null);
        setClientSearchTerm('');
        setShowClientDropdown(false);

        try {
            const response = await fetch(endpoints.clients.details(client.id), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok && data.data && data.data[0] && data.data[0].shipping_addresses) {
                setShippingAddresses(data.data[0].shipping_addresses);
                if (data.data[0].shipping_addresses.length > 0) {
                    setShowAddressModal(true);
                }
            }
        } catch (error) {
            console.error("Failed to fetch client addresses", error);
        }
    };

    const handleClearClient = () => {
        setSelectedClient(null);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setShippingAddresses([]);
        setSelectedShippingAddress(null);
    };

    // --- Calculations ---
    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.cartQuantity), 0);

    let shippingCharge = 0;
    if (shippingMethod === 'inside') shippingCharge = parseFloat(String(orderInfo.inside_dhaka || 0));
    else if (shippingMethod === 'outside') shippingCharge = parseFloat(String(orderInfo.outside_dhaka || 0));

    const vatPercentage = parseFloat(orderInfo.vat || "0");
    const vatAmount = (subtotal * vatPercentage) / 100;

    let paymentCharge = 0;
    if (paymentType === 2) { // Bkash
        const bkashRate = parseFloat(orderInfo.bkash_changed || "0");
        paymentCharge = ((subtotal + shippingCharge + vatAmount) * bkashRate) / 100;
    }

    const total = subtotal + shippingCharge + vatAmount + paymentCharge;


    // --- Place Order ---
    const placeOrderMutation = useMutation({
        mutationFn: async (orderData: any) => {
            const response = await fetch(endpoints.orders.place, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to place order');
            return data;
        },
        onSuccess: () => {
            alert('Order placed successfully!');
            setCart([]);
            setCustomerName('');
            setCustomerPhone('');
            setCustomerAddress('');
            setTrxId('');
            setPaymentPhone('');
            setShippingMethod('pickup');
            setPaymentType(1);
            setSelectedClient(null);
            setClientSearchTerm('');
        },
        onError: (error: Error) => {
            alert(error.message);
        }
    });

    const handlePlaceOrder = () => {
        if (cart.length === 0) return alert('Cart is empty');

        if (!selectedClient) {
            return alert('Please select a client or Walking Customer');
        }

        const isWalking = selectedClient.id === null;

        const payload = {
            user_id: selectedClient.id,
            ...(isWalking ? {
                user_name: selectedClient.name,
                userphone: selectedClient.phone,
                address: selectedClient.address,
            } : {}),
            shipping_charge: shippingCharge,
            product_subtotal: subtotal,
            vat: vatAmount,
            total: total,
            payment_type: paymentType,

            coupon_id: null,
            shipping_id: selectedShippingAddress?.id || null,
            ...(paymentType === 2 && {
                trxed: trxId,
                paymentphone: paymentPhone
            }),
            products: cart.map(item => ({
                product_id: item.id,
                product_sku_id: item.product_sku_id || item.id,
                quantity: item.cartQuantity
            }))
        };

        placeOrderMutation.mutate(payload);
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-100 lg:flex-row">
            {/* Left Side */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <POSHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                <ProductFilters
                    parents={parents}
                    categories={categories}
                    selectedParentCategory={selectedParentCategory}
                    selectedCategory={selectedCategory}
                    handleParentCategoryChange={handleParentCategoryChange}
                    setSelectedCategory={setSelectedCategory}
                />
                <ProductGrid
                    isLoading={loadingProducts}
                    products={products}
                    addToCart={addToCart}
                />
            </div>

            {/* Right Side */}
            <div className="w-full lg:w-96 bg-white border-l shadow-xl flex flex-col h-[50vh] lg:h-full">
                <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        {/* ShoppingCart icon could go here if needed again, or just text */}
                        Current Order
                    </h2>
                </div>

                <CartList
                    cart={cart}
                    removeFromCart={removeFromCart}
                    updateQuantity={updateQuantity}
                />

                <CheckoutForm
                    cart={cart}
                    selectedClient={selectedClient}
                    setSelectedClient={setSelectedClient}
                    clientSearchTerm={clientSearchTerm}
                    setClientSearchTerm={setClientSearchTerm}
                    showClientDropdown={showClientDropdown}
                    setShowClientDropdown={setShowClientDropdown}
                    filteredClients={filteredClients}
                    handleSelectClient={handleSelectClient}
                    handleClearClient={handleClearClient}
                    shippingAddresses={shippingAddresses}
                    selectedShippingAddress={selectedShippingAddress}
                    setSelectedShippingAddress={setSelectedShippingAddress}
                    setShowAddressModal={setShowAddressModal}
                    showAddressModal={showAddressModal}
                    showWalkingCustomerModal={showWalkingCustomerModal}
                    setShowWalkingCustomerModal={setShowWalkingCustomerModal}
                    customerName={customerName}
                    setCustomerName={setCustomerName}
                    customerPhone={customerPhone}
                    setCustomerPhone={setCustomerPhone}
                    customerAddress={customerAddress}
                    setCustomerAddress={setCustomerAddress}
                    showVariantModal={showVariantModal}
                    setShowVariantModal={setShowVariantModal}
                    selectedProductForVariant={selectedProductForVariant}
                    setSelectedProductForVariant={setSelectedProductForVariant}
                    handleVariantConfirm={handleVariantConfirm}
                    shippingMethod={shippingMethod}
                    setShippingMethod={setShippingMethod}
                    paymentType={paymentType}
                    setPaymentType={setPaymentType}
                    trxId={trxId}
                    setTrxId={setTrxId}
                    paymentPhone={paymentPhone}
                    setPaymentPhone={setPaymentPhone}
                    orderInfo={orderInfo}
                    subtotal={subtotal}
                    vatPercentage={vatPercentage}
                    vatAmount={vatAmount}
                    shippingCharge={shippingCharge}
                    paymentCharge={paymentCharge}
                    total={total}
                    handlePlaceOrder={handlePlaceOrder}
                    isPlacingOrder={placeOrderMutation.isPending}
                />
            </div>
        </div>
    );
};
