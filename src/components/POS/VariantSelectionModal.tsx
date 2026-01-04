import React from 'react';
import { X, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { Product, SkuAttribute } from '../../types/pos';

interface VariantSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onConfirm: (skuId: number, attributesDescription: string, price: string) => void;
}

export const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({ isOpen, onClose, product, onConfirm }) => {
    if (!isOpen || !product || !product.skus) return null;

    // Helper to format attributes string
    const formatAttributes = (attributes: SkuAttribute[]) => {
        if (!attributes || attributes.length === 0) return '';
        return attributes.map(attr => `${attr.attribute_name}: ${attr.value_name}`).join(', ');
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-primary-600 p-4 flex items-center justify-between shrink-0">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        Select Variation: {product.name}
                    </h3>
                    <button onClick={onClose} className="text-primary-100 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Table Content */}
                <div className="overflow-y-auto p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase border-b">SKU & Variants</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase border-b">Price</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase border-b">Stock</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase border-b text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {product.skus.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        No variations available.
                                    </td>
                                </tr>
                            ) : (
                                product.skus.map((sku) => (
                                    <tr key={sku.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="text-sm font-bold text-gray-900">{sku.sku}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {formatAttributes(sku.attributes)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-primary-600">৳{sku.price}</td>
                                        <td className="p-4 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${sku.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {sku.quantity} in stock
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => onConfirm(sku.id, formatAttributes(sku.attributes), sku.price)}
                                                disabled={sku.quantity <= 0}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sku.quantity > 0
                                                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {sku.quantity > 0 ? (
                                                    <>
                                                        <Check className="h-3 w-3" /> Select
                                                    </>
                                                ) : 'Out of Stock'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 shrink-0 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
