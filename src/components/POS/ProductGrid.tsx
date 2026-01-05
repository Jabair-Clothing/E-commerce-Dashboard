import React from 'react';
import type { Product } from '../../types/pos';

interface ProductGridProps {
    isLoading: boolean;
    products: Product[];
    addToCart: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ isLoading, products, addToCart }) => {
    return (
        <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
                <div className="flex items-center justify-center h-full">Loading products...</div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
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
    );
};
