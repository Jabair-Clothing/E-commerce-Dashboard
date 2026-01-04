import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, User, Phone, MapPin, X, Monitor } from 'lucide-react';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Product {
    id: number;
    name: string;
    price: string;
    primary_image: string | null;
    stock_quantity: number;
    category: { id: number; name: string };
    parent_category: { id: number; name: string } | null;
}

interface CartItem extends Product {
    cartQuantity: number;
}

interface Category {
    id: number;
    name: string;
    image_url: string | null;
}

interface ParentCategory {
    id: number;
    name: string;
    image: string | null;
}

export const POS: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedParentCategory, setSelectedParentCategory] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);

    // Customer Info State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [paymentType, setPaymentType] = useState<number>(1); // 1: Cash, 2: Bkash
    const [trxId, setTrxId] = useState('');
    const [paymentPhone, setPaymentPhone] = useState('');

    // Client Search State
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any | null>(null);

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

    // Fetch Sub Categories (Dependent on Parent)
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

    // Handle different response structures for all vs parent-filtered
    const categories: Category[] = categoriesData?.success
        ? (selectedParentCategory ? categoriesData.data.categories || [] : categoriesData.data)
        : [];

    // Fetch Products
    const { data: productsData, isLoading } = useQuery({
        queryKey: ['pos-products', searchTerm, selectedParentCategory, selectedCategory],
        queryFn: async () => {
            const url = new URL(endpoints.products.all);
            url.searchParams.append('limit', '100'); // Load more products for POS
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

    // Cart Actions
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, cartQuantity: item.cartQuantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, cartQuantity: 1 }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = Math.max(1, item.cartQuantity + delta);
                if (newQty > item.stock_quantity) return item; // Don't exceed stock
                return { ...item, cartQuantity: newQty };
            }
            return item;
        }));
    };

    // Order Info State
    const [shippingMethod, setShippingMethod] = useState<'pickup' | 'inside' | 'outside'>('pickup');

    // Fetch Order Info (VAT, Shipping Charges, etc.)
    const { data: orderInfoData } = useQuery({
        queryKey: ['orderInfo'],
        queryFn: async () => {
            const response = await fetch(endpoints.orderInfo.get, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                return { vat: 0, inside_dhaka: 0, outside_dhaka: 0, bkash_charge: 0 };
            }
            return response.json();
        },
        enabled: !!token
    });

    const orderInfo = orderInfoData || { vat: 0, inside_dhaka: 60, outside_dhaka: 120, bkash_charge: 0 };

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.cartQuantity), 0);

    let shippingCharge = 0;
    if (shippingMethod === 'inside') shippingCharge = parseFloat(orderInfo.inside_dhaka || 0);
    else if (shippingMethod === 'outside') shippingCharge = parseFloat(orderInfo.outside_dhaka || 0);

    const vatPercentage = parseFloat(orderInfo.vat || 0);
    const vatAmount = (subtotal * vatPercentage) / 100;

    let paymentCharge = 0;
    if (paymentType === 2) { // Bkash
        const bkashRate = parseFloat(orderInfo.bkash_charge || 0);
        paymentCharge = ((subtotal + shippingCharge + vatAmount) * bkashRate) / 100;
    }

    const total = subtotal + shippingCharge + vatAmount + paymentCharge;

    // Place Order Mutation
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

    const handleSelectClient = (client: any) => {
        setSelectedClient(client);
        setCustomerName(client.name);
        setCustomerPhone(client.phone);
        setCustomerAddress(client.address || '');
        setClientSearchTerm('');
        setShowClientDropdown(false);
    };

    const handleClearClient = () => {
        setSelectedClient(null);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
    };

    const handlePlaceOrder = () => {
        if (cart.length === 0) return alert('Cart is empty');

        if (!selectedClient && (!customerName || !customerPhone)) {
            return alert('Customer Name and Phone are required');
        }

        const payload = {
            user_id: selectedClient ? selectedClient.id : null,
            ...(selectedClient ? {} : {
                user_name: customerName,
                userphone: customerPhone,
                address: customerAddress,
            }),
            shipping_charge: shippingCharge,
            product_subtotal: subtotal,
            vat: vatAmount,
            total: total,
            payment_type: paymentType,
            coupon_id: null,
            shipping_id: null,
            ...(paymentType === 2 && {
                trxed: trxId,
                paymentphone: paymentPhone
            }),
            products: cart.map(item => ({
                product_id: item.id,
                quantity: item.cartQuantity
            }))
        };

        placeOrderMutation.mutate(payload);
    };

    const handleParentCategoryChange = (id: number | null) => {
        setSelectedParentCategory(id);
        setSelectedCategory(null);
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-100 lg:flex-row">
            {/* Left Side - Products */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="bg-white p-4 border-b flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full">
                            <X className="h-6 w-6 text-gray-500" />
                        </button>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Monitor className="h-6 w-6 text-primary-600" />
                            POS System
                        </h1>
                    </div>
                    <div className="relative w-full max-w-md ml-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white px-4 pt-3 pb-2 border-b space-y-3">
                    {/* Parent Categories */}
                    <div className="flex flex-col space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Departments</label>
                        <div className="overflow-x-auto whitespace-nowrap scrollbar-hide pb-1">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleParentCategoryChange(null)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${!selectedParentCategory ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    All Departments
                                </button>
                                {parents.map((parent: ParentCategory) => (
                                    <button
                                        key={parent.id}
                                        onClick={() => handleParentCategoryChange(parent.id)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${selectedParentCategory === parent.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        {parent.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sub Categories */}
                    <div className="flex flex-col space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Categories</label>
                        <div className="overflow-x-auto whitespace-nowrap scrollbar-hide pb-2">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedCategory ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    All Items
                                </button>
                                {categories.length === 0 ? (
                                    <span className="text-sm text-gray-400 py-2 px-2 italic">
                                        {selectedParentCategory ? 'No categories in this department' : 'No categories available'}
                                    </span>
                                ) : (
                                    categories.map((cat: Category) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">Loading products...</div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-3">
                            {products.length === 0 ? (
                                <div className="col-span-full text-center py-10 text-gray-500">
                                    No products found matching your filters.
                                </div>
                            ) : (
                                products.map(product => (
                                    <div
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full group"
                                    >
                                        <div className="relative aspect-square mb-2 bg-gray-100 rounded-md overflow-hidden">
                                            {product.primary_image ? (
                                                <img src={product.primary_image} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400 text-xs">No Image</div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        </div>
                                        <h3 className="font-medium text-gray-900 line-clamp-2 mb-1 text-xs flex-1 leading-tight">{product.name}</h3>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="font-bold text-primary-600 text-sm">৳{product.price}</span>
                                            <span className="text-[10px] text-gray-500">{product.stock_quantity} in stock</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side - Cart & Checkout */}
            <div className="w-full lg:w-96 bg-white border-l shadow-xl flex flex-col h-[50vh] lg:h-full">
                <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Current Order
                    </h2>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                            <ShoppingCart className="h-12 w-12 opacity-20" />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                <div className="h-16 w-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                    {item.primary_image && <img src={item.primary_image} className="h-full w-full object-cover" />}
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                                        <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-primary-600">৳{(parseFloat(item.price) * item.cartQuantity).toFixed(2)}</span>
                                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="p-1 hover:bg-white rounded-md transition-colors"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="text-xs font-bold w-4 text-center">{item.cartQuantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="p-1 hover:bg-white rounded-md transition-colors"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Customer & Checkout */}
                <div className="bg-gray-50 border-t p-4 space-y-4">
                    {/* Customer Info */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Customer</label>

                        {/* Client Search/Select */}
                        {!selectedClient ? (
                            <div className="relative z-20">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search Existing Client..."
                                        className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        value={clientSearchTerm}
                                        onChange={e => {
                                            setClientSearchTerm(e.target.value);
                                            setShowClientDropdown(true);
                                        }}
                                        onFocus={() => setShowClientDropdown(true)}
                                    />
                                    {clientSearchTerm && (
                                        <button onClick={() => setClientSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                                {showClientDropdown && clientSearchTerm && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y">
                                        {filteredClients.length > 0 ? (
                                            filteredClients.map((client: any) => (
                                                <button
                                                    key={client.id}
                                                    onClick={() => handleSelectClient(client)}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex flex-col"
                                                >
                                                    <span className="font-medium text-gray-900">{client.name}</span>
                                                    <span className="text-xs text-gray-500">{client.phone}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-gray-500 italic">No clients found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-2 bg-primary-50 border border-primary-200 rounded-lg">
                                <div>
                                    <div className="font-bold text-primary-900 text-sm">{selectedClient.name}</div>
                                    <div className="text-xs text-primary-700">{selectedClient.phone}</div>
                                </div>
                                <button onClick={handleClearClient} className="text-primary-600 hover:text-primary-800 text-xs font-medium">
                                    Change
                                </button>
                            </div>
                        )}

                        {/* Manual Inputs Grid (Disabled if Client Selected) */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                                <User className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Customer Name"
                                    className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg ${selectedClient ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                    value={customerName}
                                    onChange={e => !selectedClient && setCustomerName(e.target.value)}
                                    disabled={!!selectedClient}
                                />
                            </div>
                            <div className="relative">
                                <Phone className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Phone"
                                    className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg ${selectedClient ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                    value={customerPhone}
                                    onChange={e => !selectedClient && setCustomerPhone(e.target.value)}
                                    disabled={!!selectedClient}
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Address"
                                className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg ${selectedClient ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                value={customerAddress}
                                onChange={e => !selectedClient && setCustomerAddress(e.target.value)}
                                disabled={!!selectedClient}
                            />
                        </div>
                    </div>

                    {/* Shipping Method */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Shipping</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setShippingMethod('pickup')}
                                className={`py-2 px-1 text-xs sm:text-sm font-medium rounded-lg border flex flex-col items-center justify-center ${shippingMethod === 'pickup' ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                            >
                                <span>Pickup</span>
                                <span className="text-xs text-gray-500">Free</span>
                            </button>
                            <button
                                onClick={() => setShippingMethod('inside')}
                                className={`py-2 px-1 text-xs sm:text-sm font-medium rounded-lg border flex flex-col items-center justify-center ${shippingMethod === 'inside' ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                            >
                                <span>Inside Dhaka</span>
                                <span className="text-xs text-gray-500">৳{orderInfo.inside_dhaka}</span>
                            </button>
                            <button
                                onClick={() => setShippingMethod('outside')}
                                className={`py-2 px-1 text-xs sm:text-sm font-medium rounded-lg border flex flex-col items-center justify-center ${shippingMethod === 'outside' ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                            >
                                <span>Outside Dhaka</span>
                                <span className="text-xs text-gray-500">৳{orderInfo.outside_dhaka}</span>
                            </button>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Payment</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPaymentType(1)}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 border ${paymentType === 1 ? 'bg-green-50 border-green-200 text-green-700 ring-1 ring-green-500' : 'bg-white border-gray-200 text-gray-600'}`}
                            >
                                <Banknote className="h-4 w-4" /> Cash
                            </button>
                            <button
                                onClick={() => setPaymentType(2)}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 border ${paymentType === 2 ? 'bg-pink-50 border-pink-200 text-pink-700 ring-1 ring-pink-500' : 'bg-white border-gray-200 text-gray-600'}`}
                            >
                                <CreditCard className="h-4 w-4" /> Bkash
                            </button>
                        </div>
                    </div>

                    {paymentType === 2 && (
                        <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                            <input
                                type="text"
                                placeholder="Trx ID"
                                className="w-full px-3 py-2 text-sm border rounded-lg"
                                value={trxId}
                                onChange={e => setTrxId(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Payment Phone"
                                className="w-full px-3 py-2 text-sm border rounded-lg"
                                value={paymentPhone}
                                onChange={e => setPaymentPhone(e.target.value)}
                            />
                            <p className="col-span-2 text-xs text-pink-600 font-medium">
                                A charge of {orderInfo.bkash_charge}% will be added.
                            </p>
                        </div>
                    )}

                    {/* Totals */}
                    <div className="space-y-1 pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium">৳{subtotal.toFixed(2)}</span>
                        </div>
                        {vatPercentage > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">VAT ({vatPercentage}%)</span>
                                <span className="font-medium">৳{vatAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Shipping</span>
                            <span className="font-medium">৳{shippingCharge.toFixed(2)}</span>
                        </div>
                        {paymentCharge > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Bkash Charge</span>
                                <span className="font-medium">৳{paymentCharge.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-gray-900 pt-1 border-t border-dashed">
                            <span>Total</span>
                            <span>৳{total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handlePlaceOrder}
                        disabled={placeOrderMutation.isPending}
                        className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {placeOrderMutation.isPending ? 'Processing...' : 'Place Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};
