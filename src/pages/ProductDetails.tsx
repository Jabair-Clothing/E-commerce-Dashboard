import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Star, GripVertical, Plus, Upload, X } from 'lucide-react';
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
    discount_price?: string | number | null;
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
    const queryClient = useQueryClient();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        short_description: '',
        base_price: '',
        parent_category_id: 0,
        category_id: 0,
    });

    // Queries
    const { data: productData, isLoading: isLoadingProduct } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            const headers: HeadersInit = { Authorization: `Bearer ${token}` };
            const res = await fetch(endpoints.products.getById(id!), { headers });
            return res.json();
        },
        enabled: !!id && !!token,
    });

    const { data: skuAttrsData } = useQuery({
        queryKey: ['skuAttributes', id],
        queryFn: async () => {
            const headers: HeadersInit = { Authorization: `Bearer ${token}` };
            const res = await fetch(endpoints.products.skuAttributes(id!), { headers });
            return res.json();
        },
        enabled: !!id && !!token,
    });

    const { data: availAttrsData } = useQuery({
        queryKey: ['attributes'],
        queryFn: async () => {
            const headers: HeadersInit = { Authorization: `Bearer ${token}` };
            const res = await fetch(endpoints.attributes.all, { headers });
            return res.json();
        },
        enabled: !!token,
        staleTime: 600000,
    });

    const { data: parentsData } = useQuery({
        queryKey: ['parentCategories'],
        queryFn: async () => {
            const headers: HeadersInit = { Authorization: `Bearer ${token}` };
            const res = await fetch(endpoints.categories.parents, { headers });
            return res.json();
        },
        enabled: !!token,
        staleTime: 600000,
    });

    const { data: catsData } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const headers: HeadersInit = { Authorization: `Bearer ${token}` };
            const res = await fetch(endpoints.categories.all, { headers });
            return res.json();
        },
        enabled: !!token,
        staleTime: 600000,
    });

    // Derived State
    const product = productData?.success ? productData.data : null;
    if (product) {
        product.images.sort((a: ProductImage, b: ProductImage) => (a.sort_order || 999) - (b.sort_order || 999));
    }

    const skuAttributes: SkuAttributeOption[] = [];
    if (skuAttrsData?.success) {
        skuAttrsData.data.forEach((skuItem: any) => {
            skuItem.attributes.forEach((attr: any) => {
                skuAttributes.push({
                    sku_attribute_id: attr.sku_attribute_id,
                    attribute_name: attr.attribute_name,
                    value_name: attr.value_name,
                    product_image_id: attr.product_image_id
                });
            });
        });
    }

    const availableAttributes = availAttrsData?.success ? availAttrsData.data.data : [];
    const parentCategories = parentsData?.success ? parentsData.data : [];
    const categories = catsData?.success ? catsData.data : [];

    // Sync Form Data when product loads
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                description: product.description || '',
                short_description: product.short_description || '',
                base_price: product.price,
                parent_category_id: product.parent_category?.id || 0,
                category_id: product.category?.id || 0,
            });
        }
    }, [productData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Mutations

    // Local State
    const [selectedSkuAttrId, setSelectedSkuAttrId] = useState<number | ''>('');

    interface NewVariant {
        id: string;
        price: string;
        quantity: string;
        discount_price: string;
        attributes: Record<number, number>;
        image: File | null;
    }

    const [newVariants, setNewVariants] = useState<NewVariant[]>([]);

    const addNewVariantRow = () => {
        setNewVariants(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            price: product?.price || '',
            quantity: '0',
            discount_price: '',
            attributes: {},
            image: null
        }]);
    };

    const removeNewVariantRow = (id: string) => {
        setNewVariants(prev => prev.filter(v => v.id !== id));
    };

    const updateNewVariant = (id: string, field: keyof NewVariant, value: any) => {
        setNewVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    const updateNewVariantAttribute = (variantId: string, attrId: number, valueId: number) => {
        setNewVariants(prev => prev.map(v => {
            if (v.id === variantId) {
                return {
                    ...v,
                    attributes: { ...v.attributes, [attrId]: valueId }
                };
            }
            return v;
        }));
    };

    // Edit Variant State
    const [isEditSkuOpen, setIsEditSkuOpen] = useState(false);
    const [editingSku, setEditingSku] = useState<ProductSku | null>(null);
    const [editSkuForm, setEditSkuForm] = useState({
        price: '',
        quantity: '',
        discount_price: ''
    });
    const updateProductMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };
            const response = await fetch(endpoints.products.getById(id!), {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    ...data,
                    base_price: parseFloat(data.base_price),
                    parent_category_id: Number(data.parent_category_id),
                    category_id: Number(data.category_id),
                }),
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                alert('Product updated successfully!');
                queryClient.invalidateQueries({ queryKey: ['product', id] });
            } else {
                alert(`Failed to update: ${data.message}`);
            }
        },
        onError: () => alert('An error occurred while saving.')
    });

    const handleSave = () => {
        if (!id || !token) return;
        updateProductMutation.mutate(formData);
    };

    const deleteProductMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(endpoints.products.delete(Number(id)), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                navigate('/products');
            } else {
                alert(`Failed to delete product: ${data.message}`);
            }
        },
        onError: () => alert('An error occurred while deleting.')
    });

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this product?')) {
            deleteProductMutation.mutate();
        }
    };

    const addVariantMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();

            newVariants.forEach((variant, index) => {
                formData.append(`variants[${index}][price]`, variant.price || product?.price || '0');
                formData.append(`variants[${index}][quantity]`, variant.quantity);
                if (variant.discount_price) {
                    formData.append(`variants[${index}][discount_price]`, variant.discount_price);
                }
                if (variant.image) {
                    formData.append(`variants[${index}][image]`, variant.image);
                }
                Object.values(variant.attributes).forEach((valueId, attrIndex) => {
                    formData.append(`variants[${index}][attributes][${attrIndex}]`, String(valueId));
                });
            });

            const response = await fetch(endpoints.products.addSku(Number(id)), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                alert('Variants added successfully');
                setNewVariants([]);
                queryClient.invalidateQueries({ queryKey: ['product', id] });
                queryClient.invalidateQueries({ queryKey: ['skuAttributes', id] });
            } else {
                alert(`Failed to add variants: ${data.message || JSON.stringify(data.errors)}`);
            }
        },
        onError: () => alert('Error adding variants')
    });

    const handleAddVariant = () => {
        if (newVariants.length === 0) {
            alert('Please add at least one variant row.');
            return;
        }
        addVariantMutation.mutate();
    };

    const updateSkuMutation = useMutation({
        mutationFn: async () => {
            if (!editingSku) return;
            const response = await fetch(endpoints.products.updateSku(Number(id), editingSku.id), {
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
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                alert('SKU updated successfully');
                setIsEditSkuOpen(false);
                setEditingSku(null);
                queryClient.invalidateQueries({ queryKey: ['product', id] });
            } else {
                alert(`Failed to update SKU: ${data.message || JSON.stringify(data.errors)}`);
            }
        },
        onError: () => alert('Error updating SKU')
    });

    const handleUpdateSku = () => {
        updateSkuMutation.mutate();
    };

    const handleOpenEditSku = (sku: ProductSku) => {
        setEditingSku(sku);
        setEditSkuForm({
            price: String(sku.price),
            quantity: String(sku.quantity),
            discount_price: sku.discount_price ? String(sku.discount_price) : ''
        });
        setIsEditSkuOpen(true);
    };

    const deleteSkuMutation = useMutation({
        mutationFn: async (skuId: number) => {
            const response = await fetch(endpoints.products.deleteSkuData(Number(id)), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ sku_id: skuId })
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                alert('SKU deleted successfully');
                queryClient.invalidateQueries({ queryKey: ['product', id] });
                queryClient.invalidateQueries({ queryKey: ['skuAttributes', id] });
            } else {
                alert(`Failed to delete SKU: ${data.message}`);
            }
        },
        onError: () => alert('Error deleting SKU')
    });

    const handleDeleteSku = (sku: ProductSku) => {
        if (confirm('Are you sure you want to delete this variant?')) {
            deleteSkuMutation.mutate(sku.id);
        }
    };

    // --- Status Mutation ---
    const statusMutation = useMutation({
        mutationFn: async () => {
            const url = endpoints.products.updateStatus(Number(id));
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };
            const response = await fetch(url, { method: 'PATCH', headers });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['product', id] });
            } else {
                alert(`Failed to update status: ${data.message}`);
            }
        },
        onError: () => alert('Error updating status')
    });

    const handleStatusToggle = () => {
        statusMutation.mutate();
    };


    // --- Image Mutations ---

    const uploadImageMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('image', file);
            if (selectedSkuAttrId) {
                formData.append('product_sku_attribute_id', String(selectedSkuAttrId));
            }
            const response = await fetch(endpoints.products.images.upload(id!), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                alert('Image uploaded successfully');
                setSelectedSkuAttrId('');
                queryClient.invalidateQueries({ queryKey: ['product', id] });
                queryClient.invalidateQueries({ queryKey: ['skuAttributes', id] });
            } else {
                alert(`Upload failed: ${data.message}`);
            }
        },
        onError: () => alert('Error uploading image')
    });

    const deleteImageMutation = useMutation({
        mutationFn: async (imageId: number) => {
            const response = await fetch(endpoints.products.images.delete(id!, imageId), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['product', id] });
            } else {
                alert(`Delete failed: ${data.message}`);
            }
        },
        onError: () => alert('Error deleting image')
    });

    const setPrimaryImageMutation = useMutation({
        mutationFn: async ({ imageId, sortOrder }: { imageId: number, sortOrder: number }) => {
            const response = await fetch(endpoints.products.images.update(id!, imageId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ is_primary: true, sort_order: sortOrder }),
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product', id] });
        },
        onError: () => alert('Failed to set primary image')
    });

    const reorderImagesMutation = useMutation({
        mutationFn: async (newOrder: ProductImage[]) => {
            const updates = newOrder.map((img, index) => {
                const newSortOrder = index + 1;
                return fetch(endpoints.products.images.update(id!, img.id), {
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
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product', id] });
        },
        onError: () => alert('Failed to save image order')
    });

    // --- Handlers using Mutations ---

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !id || !token) return;
        uploadImageMutation.mutate(file);
        event.target.value = '';
    };

    const handleDeleteImage = (imageId: number) => {
        if (!id || !token || !confirm('Are you sure you want to delete this image?')) return;
        deleteImageMutation.mutate(imageId);
    };

    const handleSetPrimary = (imageId: number) => {
        if (!id || !token) return;
        const currentImage = product?.images.find((img: ProductImage) => img.id === imageId);
        const currentSortOrder = currentImage?.sort_order || 0;
        setPrimaryImageMutation.mutate({ imageId, sortOrder: currentSortOrder });
    };

    const handleReorder = (newOrder: ProductImage[]) => {
        if (!product || !id || !token) return;
        reorderImagesMutation.mutate(newOrder);
    };

    if (isLoadingProduct) return <div className="p-6">Loading...</div>;
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
                        disabled={updateProductMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {updateProductMutation.isPending ? 'Saving...' : 'Save Changes'}
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
                                    {parentCategories.map((pc: ParentCategory) => (
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
                                        .filter((c: Category) => formData.parent_category_id == 0 || (c as any).parent_category_id == formData.parent_category_id)
                                        .map((c: Category) => (
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
                                    {product.skus.map((sku: ProductSku) => (
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
                            {product.images.map((img: ProductImage) => (
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
                                    {skuAttributes.map((attr: SkuAttributeOption) => (
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
                                    disabled={uploadImageMutation.isPending}
                                />
                                <label
                                    htmlFor="image-upload"
                                    className={`flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-gray-50 transition-colors cursor-pointer ${uploadImageMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Upload className="h-6 w-6 text-gray-400 mb-2" />
                                    <span className="text-sm font-medium text-gray-600">
                                        {uploadImageMutation.isPending ? 'Uploading...' : 'Click to Upload New Image'}
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
                                disabled={statusMutation.isPending}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${product.is_active ? 'bg-primary-600' : 'bg-gray-200'} ${statusMutation.isPending ? 'opacity-50' : ''}`}
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

            {/* Add New Variants Section (Inline) */}
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Add New Variants</h2>

                    <div className="flex gap-2">
                        <button
                            onClick={addNewVariantRow}
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
                                        <button onClick={() => removeNewVariantRow(variant.id)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Attributes */}
                                        {availableAttributes.map((attr: Attribute) => (
                                            <div key={attr.id} className="space-y-1">
                                                <label className="block text-xs font-medium text-gray-500">{attr.name}</label>
                                                <select
                                                    className={inputClasses}
                                                    value={variant.attributes[attr.id] || ''}
                                                    onChange={(e) => updateNewVariantAttribute(variant.id, attr.id, Number(e.target.value))}
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
                                                onChange={(e) => updateNewVariant(variant.id, 'price', e.target.value)}
                                                className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-xs font-medium text-gray-500">Quantity</label>
                                            <input
                                                type="number"
                                                value={variant.quantity}
                                                onChange={(e) => updateNewVariant(variant.id, 'quantity', e.target.value)}
                                                className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-xs font-medium text-gray-500">Discount Price</label>
                                            <input
                                                type="number"
                                                value={variant.discount_price}
                                                onChange={(e) => updateNewVariant(variant.id, 'discount_price', e.target.value)}
                                                className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-xs font-medium text-gray-500">Image</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => updateNewVariant(variant.id, 'image', e.target.files?.[0] || null)}
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
                            onClick={handleAddVariant}
                            disabled={addVariantMutation.isPending || newVariants.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                            {addVariantMutation.isPending ? 'Saving...' : 'Save New Variants'}
                        </button>
                    </div>
                </div>
            </div>

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
                                disabled={updateSkuMutation.isPending}
                                className="flex-1 py-2.5 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium transition-colors"
                            >
                                {updateSkuMutation.isPending ? 'Updating...' : 'Update Variant'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
