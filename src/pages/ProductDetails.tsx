
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Upload, Star, GripVertical, X } from 'lucide-react';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';
import { Reorder, useDragControls } from 'framer-motion';

interface ProductImage {
    id: number;
    url: string;
    is_primary: boolean;
    sort_order?: number;
}

interface SkuAttribute {
    attribute_id: number;
    attribute_name: string;
    value_id: number;
    value_name: string;
    value_code: string | null;
    product_image_id: number | null;
    image_url: string | null;
}

// Interface for the SKU Attributes API response
interface SkuAttributeOption {
    sku_attribute_id: number;
    attribute_name: string;
    value_name: string;
    product_image_id: number | null;
}

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

interface ProductSku {
    id: number;
    sku: string;
    price: string;
    quantity: number;
    image: string | null;
    attributes: SkuAttribute[];
}

interface ProductDetails {
    id: number;
    name: string;
    slug: string;
    price: string;
    is_active: boolean;
    category: {
        id: number;
        name: string;
    } | null;
    parent_category: {
        id: number;
        name: string;
    } | null;
    stock_quantity: number;
    description: string;
    short_description: string;
    images: ProductImage[];
    skus: ProductSku[];
    primary_image: string | null;
}

interface Category {
    id: number;
    name: string;
    image_url: string | null;
}

interface ParentCategory {
    id: number;
    name: string;
    image_url: string | null;
}

// Draggable Image Card Component
const DraggableImageCard = ({ img, onSetPrimary, onDelete }: { img: ProductImage, onSetPrimary: (id: number) => void, onDelete: (id: number) => void }) => {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={img}
            dragListener={false}
            dragControls={controls}
            className="relative group aspect-square rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm"
        >
            <img src={img.url} alt="Product" className="w-full h-full object-cover" />

            {/* Primary Badge */}
            {img.is_primary && (
                <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded shadow-sm z-10">Primary</div>
            )}

            {/* Drag Handle */}
            <div
                className="absolute top-2 right-2 bg-white/80 p-1 rounded cursor-grab active:cursor-grabbing hover:bg-white transition-colors z-10"
                onPointerDown={(e) => controls.start(e)}
            >
                <GripVertical className="h-4 w-4 text-gray-600" />
            </div>

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.is_primary && (
                    <button
                        onClick={() => onSetPrimary(img.id)}
                        className="p-2 bg-white rounded-full text-yellow-500 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                        title="Set as Primary"
                    >
                        <Star className="h-4 w-4" />
                    </button>
                )}
                <button
                    onClick={() => onDelete(img.id)}
                    className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                    title="Delete Image"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </Reorder.Item>
    );
};

export const ProductDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<ProductDetails | null>(null);
    const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [skuAttributes, setSkuAttributes] = useState<SkuAttributeOption[]>([]);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedSkuAttrId, setSelectedSkuAttrId] = useState<number | ''>('');

    // Add Variant State
    const [isAddVariantOpen, setIsAddVariantOpen] = useState(false);
    const [availableAttributes, setAvailableAttributes] = useState<Attribute[]>([]);
    const [newVariant, setNewVariant] = useState({
        price: '',
        quantity: '0',
        attributes: {} as Record<number, number>, // attribute_id -> value_id
        image: null as File | null
    });
    const [addingVariant, setAddingVariant] = useState(false);

    // Edit Variant State
    const [isEditSkuOpen, setIsEditSkuOpen] = useState(false);
    const [editingSku, setEditingSku] = useState<ProductSku | null>(null);
    const [editSkuForm, setEditSkuForm] = useState({
        price: '',
        quantity: '',
        discount_price: ''
    });
    const [updatingSku, setUpdatingSku] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        short_description: '',
        base_price: '',
        parent_category_id: 0,
        category_id: 0,
    });

    // Function to fetch product data (reusable for updates)
    const fetchProduct = async () => {
        if (!id || !token) return;
        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };
            const response = await fetch(endpoints.products.getById(id), { headers });
            const data = await response.json();
            if (data.success) {
                const p = data.data;
                // Sort images by sort_order
                p.images.sort((a: ProductImage, b: ProductImage) => (a.sort_order || 999) - (b.sort_order || 999));
                setProduct(p);
                setFormData({
                    name: p.name,
                    description: p.description || '',
                    short_description: p.short_description || '',
                    base_price: p.price,
                    parent_category_id: p.parent_category?.id || 0,
                    category_id: p.category?.id || 0,
                });
            }
        } catch (error) {
            console.error('Error fetching product:', error);
        }
    };

    const fetchSkuAttributes = async () => {
        if (!id || !token) return;
        try {
            const headers: HeadersInit = {
                'Authorization': `Bearer ${token}`,
            };
            const response = await fetch(endpoints.products.skuAttributes(id), { headers });
            const data = await response.json();
            if (data.success) {
                // Flatten the structured response to get a list of all attribute options
                // The API returns [{ sku_id, attributes: [{ sku_attribute_id, attribute_name, value_name }] }]
                // We want to extract all unique mappable attributes? Or list by SKU?
                // The user's goal is "assign in the sku_attribute_id". A SKU Attribute ID is unique to a SKU's attribute value.
                // So we can list them like: "SKU-CODE - Size: S", "SKU-CODE - Color: Red"

                const options: SkuAttributeOption[] = [];
                data.data.forEach((skuItem: any) => {
                    skuItem.attributes.forEach((attr: any) => {
                        options.push({
                            sku_attribute_id: attr.sku_attribute_id,
                            attribute_name: attr.attribute_name,
                            value_name: attr.value_name,
                            product_image_id: attr.product_image_id
                        });
                    });
                });
                setSkuAttributes(options);
            }
        } catch (error) {
            console.error('Error fetching SKU attributes:', error);
        }
    };

    const fetchAvailableAttributes = async () => {
        if (!token) return;
        try {
            const headers: HeadersInit = { 'Authorization': `Bearer ${token}` };
            const response = await fetch(endpoints.attributes.all, { headers });
            const data = await response.json();
            if (data.success) {
                setAvailableAttributes(data.data.data);
            }
        } catch (error) {
            console.error('Error fetching attributes:', error);
        }
    };

    useEffect(() => {
        const init = async () => {
            if (!id || !token) return;
            setLoading(true);

            try {
                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                };

                await Promise.all([
                    fetchProduct(),
                    fetchSkuAttributes(),
                    fetchAvailableAttributes(),
                ]);

                // Fetch data for dropdowns
                const [parentsRes, categoriesRes] = await Promise.all([
                    fetch(endpoints.categories.parents, { headers }),
                    fetch(endpoints.categories.all, { headers })
                ]);

                const parentsData = await parentsRes.json();
                const categoriesData = await categoriesRes.json();

                if (parentsData.success) setParentCategories(parentsData.data);
                if (categoriesData.success) setCategories(categoriesData.data);

            } catch (error) {
                console.error('Error initializing:', error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [id, token]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        if (!id || !token) return;
        setSaving(true);
        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };

            const response = await fetch(endpoints.products.getById(id), {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    ...formData,
                    base_price: parseFloat(formData.base_price),
                    parent_category_id: Number(formData.parent_category_id),
                    category_id: Number(formData.category_id),
                }),
            });

            const data = await response.json();
            if (data.success) {
                alert('Product updated successfully!');
            } else {
                alert(`Failed to update: ${data.message}`);
            }
        } catch (error) {
            console.error('Error updating product:', error);
            alert('An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    // Image Management Functions
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !id || !token) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            if (selectedSkuAttrId) {
                formData.append('product_sku_attribute_id', String(selectedSkuAttrId));
            }
            // If not selected, we don't append it, or backend handles null.

            const response = await fetch(endpoints.products.images.upload(id), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();
            if (data.success || response.ok) {
                await fetchProduct(); // Reload to see new image
                await fetchSkuAttributes(); // Reload to see if attribute image status changed
                alert('Image uploaded successfully');
                setSelectedSkuAttrId(''); // Reset selection
            } else {
                alert(`Upload failed: ${data.message}`);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image');
        } finally {
            setUploading(false);
            // Reset input
            event.target.value = '';
        }
    };

    const handleDeleteImage = async (imageId: number) => {
        if (!id || !token || !confirm('Are you sure you want to delete this image?')) return;
        try {
            const response = await fetch(endpoints.products.images.delete(id, imageId), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.success || response.ok) {
                if (product) {
                    setProduct({
                        ...product,
                        images: product.images.filter(img => img.id !== imageId)
                    });
                }
            } else {
                alert(`Delete failed: ${data.message}`);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    };

    const handleSetPrimary = async (imageId: number) => {
        if (!id || !token) return;
        try {
            const currentImage = product?.images.find(img => img.id === imageId);
            const currentSortOrder = currentImage?.sort_order || 0;

            const response = await fetch(endpoints.products.images.update(id, imageId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    is_primary: true,
                    sort_order: currentSortOrder
                }),
            });

            if (response.ok) {
                // Update local state
                if (product) {
                    setProduct({
                        ...product,
                        images: product.images.map(img => ({
                            ...img,
                            is_primary: img.id === imageId
                        }))
                    });
                }
            } else {
                alert('Failed to set primary image');
            }
        } catch (error) {
            console.error('Error setting primary image:', error);
        }
    };

    // Reorder Logic
    const handleReorder = async (newOrder: ProductImage[]) => {
        if (!product || !id || !token) return;

        // Optimistic update
        setProduct({ ...product, images: newOrder });

        try {
            const updates = newOrder.map((img, index) => {
                const newSortOrder = index + 1;
                // Only send request for images that actually changed order, but sending all is safer for consistency
                return fetch(endpoints.products.images.update(id, img.id), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        sort_order: newSortOrder,
                        is_primary: img.is_primary
                    }),
                });
            });

            await Promise.all(updates);
            console.log('Order updated');

        } catch (error) {
            console.error('Error reordering images:', error);
            alert('Failed to save image order');
            fetchProduct(); // Revert on error
        }
    };

    const handleDelete = async () => {
        if (!id || !token || !confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

        try {
            const response = await fetch(endpoints.products.delete(id), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (data.success || response.ok) {
                navigate('/products');
            } else {
                alert(`Failed to delete product: ${data.message}`);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('An error occurred while deleting.');
        }
    };

    const handleAddVariant = async () => {
        if (!id || !token) return;
        setAddingVariant(true);

        try {
            const formData = new FormData();

            // variants[0][price]
            formData.append('variants[0][price]', newVariant.price || product?.price || '0');
            // variants[0][quantity]
            formData.append('variants[0][quantity]', newVariant.quantity);

            // variants[0][image]
            if (newVariant.image) {
                formData.append('variants[0][image]', newVariant.image);
            }

            // variants[0][sku] - Optional, backend generates if empty

            // variants[0][attributes][]
            Object.values(newVariant.attributes).forEach((valueId, index) => {
                formData.append(`variants[0][attributes][${index}]`, String(valueId));
            });

            const response = await fetch(endpoints.products.addSku(id), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success || response.ok) {
                alert('Variant added successfully');
                setIsAddVariantOpen(false);
                setNewVariant({ price: '', quantity: '0', attributes: {}, image: null });
                fetchProduct();
            } else {
                alert(`Failed to add variant: ${JSON.stringify(data.message || data.errors)}`);
            }
        } catch (error) {
            console.error('Error adding variant:', error);
            alert('Error adding variant');
        } finally {
            setAddingVariant(false);
        }
    };

    const handleOpenEditSku = (sku: ProductSku) => {
        setEditingSku(sku);
        setEditSkuForm({
            price: sku.price,
            quantity: String(sku.quantity),
            discount_price: ''
        });
        setIsEditSkuOpen(true);
    };

    const handleUpdateSku = async () => {
        if (!id || !token || !editingSku) return;
        setUpdatingSku(true);
        try {
            const response = await fetch(endpoints.products.updateSku(id, editingSku.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    price: parseFloat(editSkuForm.price),
                    quantity: parseInt(editSkuForm.quantity),
                    discount_price: editSkuForm.discount_price ? parseFloat(editSkuForm.discount_price) : null
                }),
            });

            const data = await response.json();
            if (data.success || response.ok) {
                alert('SKU updated successfully');
                setIsEditSkuOpen(false);
                setEditingSku(null);
                fetchProduct();
            } else {
                alert(`Failed to update SKU: ${JSON.stringify(data.message || data.errors)}`);
            }
        } catch (error) {
            console.error('Error updating SKU:', error);
            alert('Error updating SKU');
        } finally {
            setUpdatingSku(false);
        }
    };

    const handleDeleteSku = async (sku: ProductSku) => {
        if (!id || !token || !confirm('Are you sure you want to delete this variant?')) return;

        try {
            const response = await fetch(endpoints.products.deleteSkuData(id), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ sku_id: sku.id })
            });

            const data = await response.json();

            if (data.success || response.ok) {
                alert('SKU deleted successfully');
                fetchProduct();
            } else {
                alert(`Failed to delete SKU: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting SKU:', error);
            alert('Error deleting SKU');
        }
    };

    const handleStatusToggle = async () => {
        if (!id || !token || !product) return;
        try {
            const url = endpoints.products.updateStatus(Number(id));
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };

            const response = await fetch(url, {
                method: 'PATCH',
                headers,
            });

            const data = await response.json();

            if (data.success) {
                setProduct({ ...product, is_active: !product.is_active });
            } else {
                alert(`Failed to update status: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating status');
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;
    if (!product) return <div className="p-6">Product not found</div>;

    const inputClasses = "w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 bg-gray-50 focus:bg-white outline-none";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-1.5";

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
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
                        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
                        <p className="text-sm text-gray-500">{product.name}</p>
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
                        onClick={handleDelete}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
                    >
                        Delete
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className={labelClasses}>Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClasses}>Slug</label>
                                <input
                                    type="text"
                                    defaultValue={product.slug}
                                    className={`${inputClasses} bg-gray-100 text-gray-500 cursor-not-allowed focus:bg-gray-100`}
                                    readOnly
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
                                    <option value={0}>Select Parent Category</option>
                                    {parentCategories.map(pc => (
                                        <option key={pc.id} value={pc.id}>{pc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className={labelClasses}>Category</label>
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                >
                                    <option value={0}>Select Category</option>
                                    {categories
                                        .filter(c => formData.parent_category_id == 0 || (c as any).parent_category_id == formData.parent_category_id)
                                        .map(c => (
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
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClasses}>Total Stock</label>
                                <input
                                    type="text"
                                    defaultValue={product.stock_quantity}
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
                                onChange={handleInputChange}
                                className={inputClasses}
                            />
                        </div>
                        <div className="mt-6 space-y-2">
                            <label className={labelClasses}>Description</label>
                            <textarea
                                rows={4}
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {/* Variations / SKUs */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
                            <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
                            <button
                                onClick={() => setIsAddVariantOpen(true)}
                                className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                                <Plus className="h-4 w-4" /> Add Variant
                            </button>
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
                                    {product.skus.map((sku) => (
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
                                                    {sku.attributes.map(attr => (
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
                                                    onClick={() => handleOpenEditSku(sku)}
                                                    className="text-primary-600 hover:text-primary-900 mr-2"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSku(sku)}
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
                </div>

                {/* Sidebar - Images & Status */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
                            <span className="text-xs text-gray-500">Drag to reorder</span>
                        </div>

                        <Reorder.Group
                            axis="y"
                            values={product.images}
                            onReorder={handleReorder}
                            className="grid grid-cols-2 gap-4"
                        >
                            {product.images.map((img) => (
                                <DraggableImageCard
                                    key={img.id}
                                    img={img}
                                    onSetPrimary={handleSetPrimary}
                                    onDelete={handleDeleteImage}
                                />
                            ))}
                        </Reorder.Group>

                        <div className="mt-4 space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Link to Variant (Optional)
                                </label>
                                <select
                                    value={selectedSkuAttrId}
                                    onChange={(e) => setSelectedSkuAttrId(Number(e.target.value) || '')}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                                >
                                    <option value="">None (General Image)</option>
                                    {skuAttributes.map((attr) => (
                                        <option key={attr.sku_attribute_id} value={attr.sku_attribute_id}>
                                            {attr.attribute_name}: {attr.value_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <input
                                    type="file"
                                    id="image-upload"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                                <label
                                    htmlFor="image-upload"
                                    className={`flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-gray-50 transition-colors cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Upload className="h-6 w-6 text-gray-400 mb-2" />
                                    <span className="text-sm font-medium text-gray-600">
                                        {uploading ? 'Uploading...' : 'Click to Upload New Image'}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Active Status</span>
                            <button
                                onClick={handleStatusToggle}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${product.is_active ? 'bg-primary-600' : 'bg-gray-200'}`}
                            >
                                <span className="sr-only">Use setting</span>
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${product.is_active ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Variant Modal */}
            {isAddVariantOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h3 className="text-lg font-bold text-gray-900">Add New Variant</h3>
                            <button onClick={() => setIsAddVariantOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Attributes */}
                            {availableAttributes.map(attr => (
                                <div key={attr.id} className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">{attr.name}</label>
                                    <select
                                        className={inputClasses}
                                        value={newVariant.attributes[attr.id] || ''}
                                        onChange={(e) => setNewVariant({
                                            ...newVariant,
                                            attributes: { ...newVariant.attributes, [attr.id]: Number(e.target.value) }
                                        })}
                                    >
                                        <option value="">Select {attr.name}</option>
                                        {attr.values.map(val => (
                                            <option key={val.id} value={val.id}>{val.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}

                            {/* Price & Quantity */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">Price (Override)</label>
                                    <input
                                        type="number"
                                        className={inputClasses}
                                        placeholder={product.price}
                                        value={newVariant.price}
                                        onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                    <input
                                        type="number"
                                        className={inputClasses}
                                        value={newVariant.quantity}
                                        onChange={(e) => setNewVariant({ ...newVariant, quantity: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">Variant Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                    onChange={(e) => setNewVariant({ ...newVariant, image: e.target.files?.[0] || null })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 gap-2">
                            <button
                                onClick={() => setIsAddVariantOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddVariant}
                                disabled={addingVariant}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                            >
                                {addingVariant ? 'Adding...' : 'Add Variant'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit SKU Modal */}
            {isEditSkuOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h3 className="text-lg font-bold text-gray-900">Edit SKU: {editingSku?.sku}</h3>
                            <button onClick={() => setIsEditSkuOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">Price</label>
                                <input
                                    type="number"
                                    className={inputClasses}
                                    value={editSkuForm.price}
                                    onChange={(e) => setEditSkuForm({ ...editSkuForm, price: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                <input
                                    type="number"
                                    className={inputClasses}
                                    value={editSkuForm.quantity}
                                    onChange={(e) => setEditSkuForm({ ...editSkuForm, quantity: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">Discount Price (Optional)</label>
                                <input
                                    type="number"
                                    className={inputClasses}
                                    value={editSkuForm.discount_price}
                                    onChange={(e) => setEditSkuForm({ ...editSkuForm, discount_price: e.target.value })}
                                    placeholder="Leave empty for none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 gap-2">
                            <button
                                onClick={() => setIsEditSkuOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateSku}
                                disabled={updatingSku}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                            >
                                {updatingSku ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
