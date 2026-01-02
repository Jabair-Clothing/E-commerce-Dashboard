
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Upload, X } from 'lucide-react';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';

interface AttributeValue {
    id: number;
    attribute_id: number;
    name: string;
    code: string | null;
}

interface Attribute {
    id: number;
    name: string;
    slug: string;
    values: AttributeValue[];
}

interface Category {
    id: number;
    name: string;
    parent_category_id: number | null;
}

interface ParentCategory {
    id: number;
    name: string;
}

interface Variant {
    id: string; // temp id for UI
    sku: string;
    price: string;
    quantity: string;
    discount_price: string;
    attributes: Record<number, number>; // attribute_id -> value_id
    image: File | null;
}

export const AddProduct: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    const queryClient = useQueryClient();
    // fetching reference data
    const { data: parentsData, isLoading: isLoadingParents } = useQuery({
        queryKey: ['parentCategories'],
        queryFn: async () => {
            const headers: HeadersInit = { Authorization: `Bearer ${token}` };
            const res = await fetch(endpoints.categories.parents, { headers });
            return res.json();
        },
        enabled: !!token,
        staleTime: 600000,
    });

    const { data: catsData, isLoading: isLoadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const headers: HeadersInit = { Authorization: `Bearer ${token}` };
            const res = await fetch(endpoints.categories.all, { headers });
            return res.json();
        },
        enabled: !!token,
        staleTime: 600000,
    });

    const { data: attrsData, isLoading: isLoadingAttributes } = useQuery({
        queryKey: ['attributes'],
        queryFn: async () => {
            const headers: HeadersInit = { Authorization: `Bearer ${token}` };
            const res = await fetch(endpoints.attributes.all, { headers });
            return res.json();
        },
        enabled: !!token,
        staleTime: 600000,
    });

    const parentCategories: ParentCategory[] = parentsData?.success ? parentsData.data : [];
    const categories: Category[] = catsData?.success ? catsData.data : [];
    const attributes: Attribute[] = attrsData?.success ? attrsData.data.data : [];


    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        short_description: '',
        price: '', // Base Price
        discount_price: '',
        quantity: '0', // Simple product quantity
        parent_category_id: '',
        category_id: '',
    });

    const [images, setImages] = useState<File[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    // Variant Logic
    const addVariant = () => {
        setVariants(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            sku: '',
            price: formData.price, // Default to base price
            quantity: '0',
            discount_price: '',
            attributes: {},
            image: null
        }]);
    };

    const removeVariant = (id: string) => {
        setVariants(prev => prev.filter(v => v.id !== id));
    };

    const updateVariant = (id: string, field: keyof Variant, value: any) => {
        setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    const updateVariantAttribute = (variantId: string, attrId: number, valueId: number) => {
        setVariants(prev => prev.map(v => {
            if (v.id === variantId) {
                return {
                    ...v,
                    attributes: { ...v.attributes, [attrId]: valueId }
                };
            }
            return v;
        }));
    };

    const createMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const response = await fetch(endpoints.products.create, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: data,
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                alert('Product created successfully');
                queryClient.invalidateQueries({ queryKey: ['products'] });
                navigate('/products');
            } else {
                alert(`Failed to create product: ${JSON.stringify(data.message || data.errors)}`);
            }
        },
        onError: () => {
            alert('An error occurred while creating the product.');
        }
    });

    const handleSubmit = () => {
        if (!token) return;

        const data = new FormData();

        // Basic Fields
        data.append('name', formData.name);
        data.append('description', formData.description);
        if (formData.short_description) data.append('short_description', formData.short_description);
        data.append('price', formData.price);
        if (formData.discount_price) data.append('discount_price', formData.discount_price);
        if (formData.parent_category_id) data.append('parent_category_id', formData.parent_category_id);
        data.append('category_id', formData.category_id);

        // If no variants, send simple quantity
        if (variants.length === 0) {
            data.append('quantity', formData.quantity);
        }

        // Images
        images.forEach((img) => {
            data.append('images[]', img);
        });

        // Variants
        variants.forEach((variant, index) => {
            if (variant.sku) data.append(`variants[${index}][sku]`, variant.sku);
            data.append(`variants[${index}][price]`, variant.price);
            data.append(`variants[${index}][quantity]`, variant.quantity);
            if (variant.discount_price) data.append(`variants[${index}][discount_price]`, variant.discount_price);

            if (variant.image) {
                data.append(`variants[${index}][image]`, variant.image);
            }

            // Attributes
            Object.values(variant.attributes).forEach((valId, attrIndex) => {
                data.append(`variants[${index}][attributes][${attrIndex}]`, String(valId));
            });
        });

        createMutation.mutate(data);
    };

    if (isLoadingParents || isLoadingCategories || isLoadingAttributes) return <div className="p-6">Loading...</div>;

    const inputClasses = "w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 bg-gray-50 focus:bg-white outline-none";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-1.5";

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/products')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
                        <p className="text-sm text-gray-500">Create a new product with variants</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/products')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={createMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {createMutation.isPending ? 'Creating...' : 'Create Product'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 col-span-2">
                                <label className={labelClasses}>Product Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                    placeholder="e.g. Cotton T-Shirt"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClasses}>Parent Category</label>
                                <select
                                    name="parent_category_id"
                                    value={formData.parent_category_id}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                >
                                    <option value="">Select Parent Category</option>
                                    {parentCategories.map(pc => (
                                        <option key={pc.id} value={pc.id}>{pc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className={labelClasses}>Category *</label>
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                >
                                    <option value="">Select Category</option>
                                    {categories
                                        .filter(c => !formData.parent_category_id || c.parent_category_id === Number(formData.parent_category_id))
                                        .map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className={labelClasses}>Base Price (৳) *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClasses}>Discount Price (৳)</label>
                                <input
                                    type="number"
                                    name="discount_price"
                                    value={formData.discount_price}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                    placeholder="Optional"
                                />
                            </div>

                            {variants.length === 0 && (
                                <div className="space-y-2">
                                    <label className={labelClasses}>Quantity (Simple Product)</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        className={inputClasses}
                                    />
                                </div>
                            )}

                        </div>
                        <div className="mt-6 space-y-2">
                            <label className={labelClasses}>Short Description</label>
                            <textarea
                                rows={2}
                                name="short_description"
                                value={formData.short_description}
                                onChange={handleInputChange}
                                className={inputClasses}
                            />
                        </div>
                        <div className="mt-6 space-y-2">
                            <label className={labelClasses}>Description *</label>
                            <textarea
                                rows={4}
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {/* Variants Section */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
                            <button
                                onClick={addVariant}
                                className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                                <Plus className="h-4 w-4" /> Add Variant
                            </button>
                        </div>

                        {variants.length > 0 ? (
                            <div className="p-6 space-y-6">
                                {variants.map((variant, index) => (
                                    <div key={variant.id} className="p-4 border border-gray-200 rounded-lg space-y-4 bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-medium text-gray-900">Variant #{index + 1}</h4>
                                            <button onClick={() => removeVariant(variant.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {/* Attributes */}
                                            {attributes.map(attr => (
                                                <div key={attr.id} className="space-y-1">
                                                    <label className="block text-xs font-medium text-gray-500">{attr.name}</label>
                                                    <select
                                                        className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm"
                                                        value={variant.attributes[attr.id] || ''}
                                                        onChange={(e) => updateVariantAttribute(variant.id, attr.id, Number(e.target.value))}
                                                    >
                                                        <option value="">Select {attr.name}</option>
                                                        {attr.values.map(val => (
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
                                                    onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                                                    className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-gray-500">Quantity</label>
                                                <input
                                                    type="number"
                                                    value={variant.quantity}
                                                    onChange={(e) => updateVariant(variant.id, 'quantity', e.target.value)}
                                                    className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-gray-500">Discount Price</label>
                                                <input
                                                    type="number"
                                                    value={variant.discount_price}
                                                    onChange={(e) => updateVariant(variant.id, 'discount_price', e.target.value)}
                                                    className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-gray-500">Image</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => updateVariant(variant.id, 'image', e.target.files?.[0] || null)}
                                                    className="w-full text-xs text-gray-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                <p>No variants added. Product will be created as a simple product.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Images */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden group">
                                    <img src={URL.createObjectURL(img)} alt="preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-1 right-1 bg-white p-1 rounded-full text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4">
                            <input
                                type="file"
                                id="main-images"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                            <label
                                htmlFor="main-images"
                                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                <Upload className="h-6 w-6 text-gray-400 mb-2" />
                                <span className="text-sm font-medium text-gray-600">
                                    Upload Images
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
