import React from 'react';
import type { ParentCategory, Category } from '../../types/productTypes';

interface BasicInfoFormProps {
    formData: {
        name: string;
        description: string;
        short_description: string;
        base_price: string;
        parent_category_id: number;
        category_id: number;
    };
    slug: string;
    stockQuantity: number;
    parentCategories: ParentCategory[];
    categories: Category[];
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
    formData,
    slug,
    stockQuantity,
    parentCategories,
    categories,
    onChange
}) => {
    const inputClasses = "w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 bg-gray-50 focus:bg-white outline-none";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-1.5";

    return (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className={labelClasses}>Product Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={onChange}
                        className={inputClasses}
                    />
                </div>
                <div className="space-y-2">
                    <label className={labelClasses}>Slug</label>
                    <input
                        type="text"
                        defaultValue={slug}
                        className={`${inputClasses} bg-gray-100 text-gray-500 cursor-not-allowed focus:bg-gray-100`}
                        readOnly
                    />
                </div>
                <div className="space-y-2">
                    <label className={labelClasses}>Parent Category</label>
                    <select
                        name="parent_category_id"
                        value={formData.parent_category_id}
                        onChange={onChange}
                        className={inputClasses}
                    >
                        <option value={0}>Select Parent Category</option>
                        {parentCategories.map((pc) => (
                            <option key={pc.id} value={pc.id}>{pc.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className={labelClasses}>Category</label>
                    <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={onChange}
                        className={inputClasses}
                    >
                        <option value={0}>Select Category</option>
                        {categories
                            .filter((c: any) => formData.parent_category_id == 0 || c.parent_category_id == formData.parent_category_id)
                            .map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className={labelClasses}>Base Price (৳)</label>
                    <input
                        type="number"
                        name="base_price"
                        value={formData.base_price}
                        onChange={onChange}
                        className={inputClasses}
                    />
                </div>
                <div className="space-y-2">
                    <label className={labelClasses}>Total Stock</label>
                    <input
                        type="text"
                        defaultValue={stockQuantity}
                        className={`${inputClasses} bg-gray-100 text-gray-500 cursor-not-allowed focus:bg-gray-100`}
                        readOnly
                    />
                </div>
            </div>
            <div className="mt-6 space-y-2">
                <label className={labelClasses}>Short Description</label>
                <textarea
                    rows={2}
                    name="short_description"
                    value={formData.short_description}
                    onChange={onChange}
                    className={inputClasses}
                />
            </div>
            <div className="mt-6 space-y-2">
                <label className={labelClasses}>Description</label>
                <textarea
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={onChange}
                    className={inputClasses}
                />
            </div>
        </div>
    );
};
