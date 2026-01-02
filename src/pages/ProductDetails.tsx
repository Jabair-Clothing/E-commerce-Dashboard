
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Upload } from 'lucide-react';
import { endpoints } from '../config';
import { useAuth } from '../context/AuthContext';

interface ProductImage {
    id: number;
    url: string;
    is_primary: boolean;
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

export const ProductDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<ProductDetails | null>(null);
    const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        short_description: '',
        base_price: '',
        parent_category_id: 0,
        category_id: 0,
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !token) return;

            try {
                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                };

                // Fetch Product
                const productRes = await fetch(endpoints.products.getById(id), { headers });
                const productData = await productRes.json();

                // Fetch Parent Categories
                const parentsRes = await fetch(endpoints.categories.parents, { headers });
                const parentsData = await parentsRes.json();

                // Fetch Categories
                const categoriesRes = await fetch(endpoints.categories.all, { headers });
                const categoriesData = await categoriesRes.json();

                if (productData.success) {
                    const p = productData.data;
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

                if (parentsData.success) {
                    setParentCategories(parentsData.data);
                }

                if (categoriesData.success) {
                    setCategories(categoriesData.data);
                }

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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

            const response = await fetch(endpoints.products.getById(id), { // URL is same for GET and PUT usually in REST
                method: 'PUT', // Assuming PUT for update, user didn't specify method but body suggests update
                headers,
                body: JSON.stringify({
                    ...formData,
                    base_price: parseFloat(formData.base_price), // Ensure number
                    parent_category_id: Number(formData.parent_category_id),
                    category_id: Number(formData.category_id),
                }),
            });

            const data = await response.json();

            if (data.success) {
                console.log('Product updated successfully');
                alert('Product updated successfully!');
            } else {
                console.error('Failed to update product:', data.message);
                alert(`Failed to update: ${data.message}`);
            }

        } catch (error) {
            console.error('Error updating product:', error);
            alert('An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    if (!product) {
        return <div className="p-6">Product not found</div>;
    }

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
                                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Slug</label>
                                <input
                                    type="text"
                                    defaultValue={product.slug}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-gray-50"
                                    readOnly
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Parent Category</label>
                                <select
                                    name="parent_category_id"
                                    value={formData.parent_category_id}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                >
                                    <option value={0}>Select Parent Category</option>
                                    {parentCategories.map(pc => (
                                        <option key={pc.id} value={pc.id}>{pc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
                                <label className="block text-sm font-medium text-gray-700">Base Price (৳)</label>
                                <input
                                    type="number"
                                    name="base_price"
                                    value={formData.base_price}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Total Stock</label>
                                <input
                                    type="text"
                                    defaultValue={product.stock_quantity}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-gray-50"
                                    readOnly
                                />
                            </div>
                        </div>
                        <div className="mt-6 space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Short Description</label>
                            <textarea
                                rows={2}
                                name="short_description"
                                value={formData.short_description}
                                onChange={handleInputChange}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                        </div>
                        <div className="mt-6 space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                rows={4}
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* Variations / SKUs */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
                            <button className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
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
                                                <button className="text-primary-600 hover:text-primary-900 mr-2">Edit</button>
                                                <button className="text-red-600 hover:text-red-900">Delete</button>
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
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {product.images.map((img) => (
                                <div key={img.id} className="relative group aspect-square rounded-lg border border-gray-200 overflow-hidden">
                                    <img src={img.url} alt="Product" className="w-full h-full object-cover" />
                                    {img.is_primary && (
                                        <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">Primary</div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button className="p-1 bg-white rounded-full text-red-600 hover:bg-red-50">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-500 hover:bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:text-primary-600 transition-colors">
                                <Upload className="h-6 w-6 mb-2" />
                                <span className="text-xs font-medium">Upload New</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Active Status</span>
                            <button
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
        </div>
    );
};
