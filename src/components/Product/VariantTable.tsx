import React from 'react';
import type { ProductSku, SkuAttribute } from '../../types/productTypes';

interface VariantTableProps {
    skus: ProductSku[];
    onEdit: (sku: ProductSku) => void;
    onDelete: (sku: ProductSku) => void;
}

export const VariantTable: React.FC<VariantTableProps> = ({ skus, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attributes</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {skus.map((sku) => (
                            <tr key={sku.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {sku.image ? (
                                        <img src={sku.image} alt={sku.sku} className="h-10 w-10 rounded object-cover" />
                                    ) : (
                                        <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                            <span className="text-xs">No img</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sku.sku}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <div className="flex flex-wrap gap-1">
                                        {sku.attributes.map((attr: SkuAttribute) => (
                                            <span key={attr.attribute_id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                {attr.attribute_name}: {attr.value_name}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">৳{sku.price}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sku.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => onEdit(sku)}
                                        className="text-primary-600 hover:text-primary-900 mr-2"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => onDelete(sku)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
