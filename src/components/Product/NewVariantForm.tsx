import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { NewVariant, Attribute, AttributeValue } from '../../types/productTypes';

interface NewVariantFormProps {
    newVariants: NewVariant[];
    availableAttributes: Attribute[];
    isSaving: boolean;
    onAddRow: () => void;
    onRemoveRow: (id: string) => void;
    onUpdateVariant: (id: string, field: keyof NewVariant, value: any) => void;
    onUpdateAttribute: (variantId: string, attrId: number, valueId: number) => void;
    onSave: () => void;
}

export const NewVariantForm: React.FC<NewVariantFormProps> = ({
    newVariants,
    availableAttributes,
    isSaving,
    onAddRow,
    onRemoveRow,
    onUpdateVariant,
    onUpdateAttribute,
    onSave
}) => {
    const inputClasses = "w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 bg-gray-50 focus:bg-white outline-none";

    return (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Add New Variants</h2>

                <div className="flex gap-2">
                    <button
                        onClick={onAddRow}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                        <Plus className="h-4 w-4" /> Add Another Row
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {newVariants.length > 0 ? (
                    <div className="space-y-6">
                        {newVariants.map((variant, index) => (
                            <div key={variant.id} className="p-4 border border-gray-200 rounded-lg space-y-4 bg-gray-50 relative">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-medium text-gray-900">New Variant #{index + 1}</h4>
                                    <button onClick={() => onRemoveRow(variant.id)} className="text-red-500 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Attributes */}
                                    {availableAttributes.map((attr) => (
                                        <div key={attr.id} className="space-y-1">
                                            <label className="block text-xs font-medium text-gray-500">{attr.name}</label>
                                            <select
                                                className={inputClasses}
                                                value={variant.attributes[attr.id] || ''}
                                                onChange={(e) => onUpdateAttribute(variant.id, attr.id, Number(e.target.value))}
                                            >
                                                <option value="">Select {attr.name}</option>
                                                {attr.values.map((val: AttributeValue) => (
                                                    <option key={val.id} value={val.id}>{val.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-medium text-gray-500">Price</label>
                                        <input
                                            type="number"
                                            value={variant.price}
                                            onChange={(e) => onUpdateVariant(variant.id, 'price', e.target.value)}
                                            className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-medium text-gray-500">Quantity</label>
                                        <input
                                            type="number"
                                            value={variant.quantity}
                                            onChange={(e) => onUpdateVariant(variant.id, 'quantity', e.target.value)}
                                            className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-medium text-gray-500">Discount Price</label>
                                        <input
                                            type="number"
                                            value={variant.discount_price}
                                            onChange={(e) => onUpdateVariant(variant.id, 'discount_price', e.target.value)}
                                            className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-medium text-gray-500">Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => onUpdateVariant(variant.id, 'image', e.target.files?.[0] || null)}
                                            className="w-full text-xs text-gray-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p>No new variants added. Click "Add Another Row" to start adding variants.</p>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button
                        onClick={onSave}
                        disabled={isSaving || newVariants.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                        {isSaving ? 'Saving...' : 'Save New Variants'}
                    </button>
                </div>
            </div>
        </div>
    );
};
