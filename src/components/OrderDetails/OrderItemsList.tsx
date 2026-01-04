import React from 'react';
import { Package, Plus, Search, X, Trash2, Minus } from 'lucide-react';
import type { Product } from '../../types/pos';
import type { OrderItemSegment } from '../../types/order';

interface OrderItemsListProps {
    items: OrderItemSegment[];
    showAddProduct: boolean;
    searchTerm: string;
    searchResults: Product[];
    onToggleAddProduct: () => void;
    onSearchChange: (value: string) => void;
    onProductSelect: (product: Product) => void;
    onQuantityUpdate: (productId: number, quantity: number) => void;
    onRemoveItem: (productId: number) => void;
    isUpdating: boolean;
}

export const OrderItemsList: React.FC<OrderItemsListProps> = ({
    items,
    showAddProduct,
    searchTerm,
    searchResults,
    onToggleAddProduct,
    onSearchChange,
    onProductSelect,
    onQuantityUpdate,
    onRemoveItem,
    isUpdating
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-400" />
                    Order Items
                </h2>
                {!showAddProduct ? (
                    <button
                        onClick={onToggleAddProduct}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                        <Plus className="h-4 w-4" /> Add Item
                    </button>
                ) : (
                    <button
                        onClick={onToggleAddProduct}
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
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500"
                            autoFocus
                        />
                    </div>
                    {searchTerm.length >= 2 && searchResults.length > 0 && (
                        <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-10">
                            {searchResults.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => onProductSelect(product)}
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
                {items.map((item) => (
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
                                            onClick={() => onQuantityUpdate(item.product_id, parseInt(item.quantity) - 1)}
                                            disabled={parseInt(item.quantity) <= 1 || isUpdating}
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
                                                if (val > 0) onQuantityUpdate(item.product_id, val);
                                            }}
                                            className="w-12 text-center border-0 focus:ring-0 text-sm py-0.5"
                                        />
                                        <button
                                            onClick={() => onQuantityUpdate(item.product_id, parseInt(item.quantity) + 1)}
                                            disabled={isUpdating}
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
                                        onClick={() => onRemoveItem(item.product_id)}
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
    );
};
