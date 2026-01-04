import React from 'react';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import type { CartItem } from '../../types/pos';

interface CartListProps {
    cart: CartItem[];
    removeFromCart: (productId: number, productSkuId?: number | null) => void;
    updateQuantity: (productId: number, delta: number, productSkuId?: number | null) => void;
}

export const CartList: React.FC<CartListProps> = ({ cart, removeFromCart, updateQuantity }) => {
    return (
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
                                <h4 className="font-medium text-sm line-clamp-1">
                                    {item.name}
                                    {item.variant_description && <span className="text-xs text-gray-500 block">{item.variant_description}</span>}
                                </h4>
                                <button onClick={() => removeFromCart(item.id, item.product_sku_id)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-primary-600">৳{(parseFloat(item.price) * item.cartQuantity).toFixed(2)}</span>
                                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => updateQuantity(item.id, -1, item.product_sku_id)}
                                        className="p-1 hover:bg-white rounded-md transition-colors"
                                    >
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="text-xs font-bold w-4 text-center">{item.cartQuantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, 1, item.product_sku_id)}
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
    );
};
