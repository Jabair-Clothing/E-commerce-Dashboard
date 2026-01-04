import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';
import { ProductHeader } from '../components/Product/ProductHeader';
import { BasicInfoForm } from '../components/Product/BasicInfoForm';
import { VariantTable } from '../components/Product/VariantTable';
import { ImageGallery } from '../components/Product/ImageGallery';
import { StatusCard } from '../components/Product/StatusCard';
import { NewVariantForm } from '../components/Product/NewVariantForm';
import { EditSkuModal } from '../components/Product/EditSkuModal';
import type {
    ProductImage,
    ProductSku,
    NewVariant,
    SkuAttributeOption,
} from '../types/productTypes';

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
    const { data: productData, isPending: isLoadingProduct } = useQuery({
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

    // Sort images safely without mutating the original read-only array
    const sortedImages = product?.images ? [...product.images].sort((a: ProductImage, b: ProductImage) => (a.sort_order || 999) - (b.sort_order || 999)) : [];

    const skuAttributes: SkuAttributeOption[] = [];
    if (skuAttrsData?.success && Array.isArray(skuAttrsData.data)) {
        skuAttrsData.data.forEach((skuItem: any) => {
            if (skuItem.attributes && Array.isArray(skuItem.attributes)) {
                skuItem.attributes.forEach((attr: any) => {
                    skuAttributes.push({
                        sku_attribute_id: attr.sku_attribute_id,
                        attribute_name: attr.attribute_name,
                        value_name: attr.value_name,
                        product_image_id: attr.product_image_id
                    });
                });
            }
        });
    }

    const availableAttributes = (() => {
        if (!availAttrsData?.success) return [];
        if (Array.isArray(availAttrsData.data)) return availAttrsData.data;
        if (Array.isArray(availAttrsData.data?.data)) return availAttrsData.data.data;
        return [];
    })();

    const parentCategories = (() => {
        if (!parentsData?.success) return [];
        if (Array.isArray(parentsData.data)) return parentsData.data;
        if (Array.isArray(parentsData.data?.data)) return parentsData.data.data;
        return [];
    })();

    const categories = (() => {
        if (!catsData?.success) return [];
        if (Array.isArray(catsData.data)) return catsData.data;
        if (Array.isArray(catsData.data?.data)) return catsData.data.data;
        return [];
    })();

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

    // Local State
    const [selectedSkuAttrId, setSelectedSkuAttrId] = useState<number | ''>('');
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

    // Mutations
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

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <ProductHeader
                productName={product.name}
                isSaving={updateProductMutation.isPending}
                onSave={handleSave}
                onDelete={handleDelete}
                onCancel={() => navigate('/products')}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <BasicInfoForm
                        formData={formData}
                        slug={product.slug}
                        stockQuantity={product.stock_quantity}
                        parentCategories={parentCategories}
                        categories={categories}
                        onChange={handleInputChange}
                    />

                    <VariantTable
                        skus={product.skus}
                        onEdit={handleOpenEditSku}
                        onDelete={handleDeleteSku}
                    />
                </div>

                {/* Sidebar - Images & Status */}
                <div className="space-y-6">
                    <ImageGallery
                        images={sortedImages}
                        skuAttributes={skuAttributes}
                        selectedSkuAttrId={selectedSkuAttrId}
                        isUploading={uploadImageMutation.isPending}
                        onReorder={handleReorder}
                        onSetPrimary={handleSetPrimary}
                        onDelete={handleDeleteImage}
                        onSkuAttrChange={setSelectedSkuAttrId}
                        onUpload={handleImageUpload}
                    />

                    <StatusCard
                        isActive={product.is_active}
                        isPending={statusMutation.isPending}
                        onToggle={handleStatusToggle}
                    />
                </div>
            </div>

            {/* Add New Variants Section (Inline) */}
            <NewVariantForm
                newVariants={newVariants}
                availableAttributes={availableAttributes}
                isSaving={addVariantMutation.isPending}
                onAddRow={addNewVariantRow}
                onRemoveRow={removeNewVariantRow}
                onUpdateVariant={updateNewVariant}
                onUpdateAttribute={updateNewVariantAttribute}
                onSave={handleAddVariant}
            />

            {/* Edit SKU Modal */}
            <EditSkuModal
                isOpen={isEditSkuOpen}
                sku={editingSku}
                form={editSkuForm}
                isUpdating={updateSkuMutation.isPending}
                onClose={() => setIsEditSkuOpen(false)}
                onChange={(field, value) => setEditSkuForm(prev => ({ ...prev, [field]: value }))}
                onUpdate={handleUpdateSku}
            />
        </div>
    );
};
