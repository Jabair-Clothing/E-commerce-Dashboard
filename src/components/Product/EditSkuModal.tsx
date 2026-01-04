import React from 'react';
import { X } from 'lucide-react';
import type { ProductSku } from '../../types/productTypes';

interface EditSkuModalProps {
    isOpen: boolean;
    sku: ProductSku | null;
    form: {
        price: string;
        quantity: string;
        discount_price: string;
    };
    isUpdating: boolean;
    onClose: () => void;
    onChange: (field: string, value: string) => void;
    onUpdate: () => void;
}

export const EditSkuModal: React.FC<EditSkuModalProps> = ({
    isOpen,
    sku,
    form,
    isUpdating,
    onClose,
    onChange,
    onUpdate
}) => {
    if (!isOpen || !sku) return null;

    const inputClasses = "w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 bg-gray-50 focus:bg-white outline-none";

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="text-lg font-bold text-gray-900">Edit SKU: {sku.sku}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Price</label>
                        <input
                            type="number"
                            className={inputClasses}
                            value={form.price}
                            onChange={(e) => onChange('price', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input
                            type="number"
                            className={inputClasses}
                            value={form.quantity}
                            onChange={(e) => onChange('quantity', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Discount Price (Optional)</label>
                        <input
                            type="number"
                            className={inputClasses}
                            value={form.discount_price}
                            onChange={(e) => onChange('discount_price', e.target.value)}
                            placeholder="Leave empty for none"
                        />
                    </div>
                </div>
                <div className="flex justify-end pt-4 gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onUpdate}
                        disabled={isUpdating}
                        className="flex-1 py-2.5 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium transition-colors"
                    >
                        {isUpdating ? 'Updating...' : 'Update Variant'}
                    </button>
                </div>
            </div>
        </div>
    );
};
