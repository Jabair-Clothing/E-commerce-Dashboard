import React from 'react';
import { createPortal } from 'react-dom';
import { Search, User, MapPin, X, Banknote, CreditCard } from 'lucide-react';
import { VariantSelectionModal } from './VariantSelectionModal';
import type { Product, OrderInfo } from '../../types/pos';

interface CheckoutFormProps {
    cart: any[];
    selectedClient: any;
    setSelectedClient: (client: any) => void;
    clientSearchTerm: string;
    setClientSearchTerm: (term: string) => void;
    showClientDropdown: boolean;
    setShowClientDropdown: (show: boolean) => void;
    filteredClients: any[];
    handleSelectClient: (client: any) => void;
    handleClearClient: () => void;
    shippingAddresses: any[];
    selectedShippingAddress: any;
    setSelectedShippingAddress: (addr: any) => void;
    setShowAddressModal: (show: boolean) => void;
    showAddressModal: boolean;
    showWalkingCustomerModal: boolean;
    setShowWalkingCustomerModal: (show: boolean) => void;
    customerName: string;
    setCustomerName: (name: string) => void;
    customerPhone: string;
    setCustomerPhone: (phone: string) => void;
    customerAddress: string;
    setCustomerAddress: (address: string) => void;
    showVariantModal: boolean;
    setShowVariantModal: (show: boolean) => void;
    selectedProductForVariant: Product | null;
    setSelectedProductForVariant: (product: Product | null) => void;
    handleVariantConfirm: (skuId: number, description: string, price: string) => void;
    shippingMethod: 'pickup' | 'inside' | 'outside';
    setShippingMethod: (method: 'pickup' | 'inside' | 'outside') => void;
    paymentType: number;
    setPaymentType: (type: number) => void;
    trxId: string;
    setTrxId: (id: string) => void;
    paymentPhone: string;
    setPaymentPhone: (phone: string) => void;
    orderInfo: OrderInfo;
    subtotal: number;
    vatPercentage: number;
    vatAmount: number;
    shippingCharge: number;
    paymentCharge: number;
    total: number;
    handlePlaceOrder: () => void;
    isPlacingOrder: boolean;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = (props) => {
    const {
        selectedClient, setSelectedClient,
        clientSearchTerm, setClientSearchTerm,
        showClientDropdown, setShowClientDropdown,
        filteredClients, handleSelectClient, handleClearClient,
        shippingAddresses, selectedShippingAddress, setSelectedShippingAddress,
        setShowAddressModal, showAddressModal,
        showWalkingCustomerModal, setShowWalkingCustomerModal,
        customerName, setCustomerName,
        customerPhone, setCustomerPhone,
        customerAddress, setCustomerAddress,
        showVariantModal, setShowVariantModal,
        selectedProductForVariant, setSelectedProductForVariant, handleVariantConfirm,
        shippingMethod, setShippingMethod,
        paymentType, setPaymentType,
        trxId, setTrxId,
        paymentPhone, setPaymentPhone,
        orderInfo,
        subtotal, vatPercentage, vatAmount, shippingCharge, paymentCharge, total,
        handlePlaceOrder, isPlacingOrder
    } = props;

    // Helper to close walking modal
    const closeWalkingModal = () => setShowWalkingCustomerModal(false);

    return (
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
                        {showClientDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y z-50">
                                <button
                                    onClick={() => {
                                        setShowWalkingCustomerModal(true);
                                        setShowClientDropdown(false);
                                        setCustomerName('');
                                        setCustomerPhone('');
                                        setCustomerAddress('');
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 text-primary-700 font-medium flex items-center gap-2"
                                >
                                    <User className="h-4 w-4" /> Walking Customer
                                </button>
                                {filteredClients.map((client: any) => (
                                    <button
                                        key={client.id}
                                        onClick={() => handleSelectClient(client)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex flex-col"
                                    >
                                        <span className="font-medium text-gray-900">{client.name}</span>
                                        <span className="text-xs text-gray-500">{client.phone}</span>
                                    </button>
                                ))}
                                {filteredClients.length === 0 && (
                                    <div className="px-3 py-2 text-sm text-gray-500 italic">No existing clients found</div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-2 bg-primary-50 border border-primary-200 rounded-lg">
                        <div>
                            <div className="font-bold text-primary-900 text-sm">{selectedClient.name} {selectedClient.id === null && '(Walking)'}</div>
                            <div className="text-xs text-primary-700">{selectedClient.phone}</div>
                            {selectedShippingAddress ? (
                                <div className="text-xs text-green-700 mt-1 font-medium flex items-start gap-1">
                                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span>
                                        {selectedShippingAddress.address}, {selectedShippingAddress.city}
                                    </span>
                                </div>
                            ) : (
                                selectedClient.address && <div className="text-xs text-primary-600 mt-0.5">{selectedClient.address}</div>
                            )}
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                            <button onClick={handleClearClient} className="text-primary-600 hover:text-primary-800 text-xs font-medium">
                                Change
                            </button>
                            {shippingAddresses.length > 0 && (
                                <button
                                    onClick={() => setShowAddressModal(true)}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                    {selectedShippingAddress ? 'Change Address' : 'Select Address'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Address selection modal */}
                {showAddressModal && createPortal(
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="bg-primary-600 p-4 flex items-center justify-between">
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    <MapPin className="h-5 w-5" /> Select Shipping Address
                                </h3>
                                <button onClick={() => setShowAddressModal(false)} className="text-primary-100 hover:text-white">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                                {shippingAddresses.map((addr: any) => (
                                    <div
                                        key={addr.id}
                                        onClick={() => {
                                            setSelectedShippingAddress(addr);
                                            setShowAddressModal(false);
                                        }}
                                        className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${selectedShippingAddress?.id === addr.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200 hover:border-primary-300'}`}
                                    >
                                        <div className="font-medium text-sm text-gray-900">{addr.f_name} {addr.l_name}</div>
                                        <div className="text-xs text-gray-600">{addr.phone}</div>
                                        <div className="text-xs text-gray-800 mt-1">{addr.address}, {addr.city} - {addr.zip}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t bg-gray-50 flex justify-end">
                                <button
                                    onClick={() => setShowAddressModal(false)}
                                    className="text-gray-600 text-sm hover:underline"
                                >
                                    Skip & Use Default
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Walking Customer Modal */}
                {showWalkingCustomerModal && createPortal(
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="bg-primary-600 p-4 flex items-center justify-between">
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    <User className="h-5 w-5" /> Walking Customer
                                </h3>
                                <button onClick={closeWalkingModal} className="text-primary-100 hover:text-white">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-4 space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="Enter Name"
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Phone</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="Enter Phone"
                                        value={customerPhone}
                                        onChange={e => setCustomerPhone(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Address</label>
                                    <textarea
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="Enter Address"
                                        rows={2}
                                        value={customerAddress}
                                        onChange={e => setCustomerAddress(e.target.value)}
                                    />
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={closeWalkingModal}
                                        className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!customerName || !customerPhone) return alert("Name and Phone are required");
                                            setSelectedClient({
                                                id: null,
                                                name: customerName,
                                                phone: customerPhone,
                                                address: customerAddress
                                            });
                                            setShowWalkingCustomerModal(false);
                                        }}
                                        className="flex-1 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 shadow-md"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Variant Selection Modal */}
                <VariantSelectionModal
                    isOpen={showVariantModal}
                    onClose={() => {
                        setShowVariantModal(false);
                        setSelectedProductForVariant(null);
                    }}
                    product={selectedProductForVariant as any}
                    onConfirm={handleVariantConfirm}
                />
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
                disabled={isPlacingOrder}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPlacingOrder ? 'Processing...' : 'Place Order'}
            </button>
        </div>
    );
};
