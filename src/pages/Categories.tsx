import React, { useEffect, useState, useRef } from 'react';
import { Plus, MoreHorizontal, Loader2, X, ChevronDown, Trash2, Edit } from 'lucide-react';
import { endpoints } from '../config';
import type { Category, ParentCategory } from '../types/category';
import { useAuth } from '../context/AuthContext';
import { getOptimizedImageUrl } from '../utils/image';
import { createPortal } from 'react-dom';

// Simple Modal Component
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg ring-1 ring-gray-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export const Categories: React.FC = () => {
    const { token } = useAuth();
    const [parents, setParents] = useState<ParentCategory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeTab, setActiveTab] = useState<number | 'all'>('all');
    const [loading, setLoading] = useState(true);
    const [fetchingCategories, setFetchingCategories] = useState(false);

    // Dropdown & Modal State
    const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
    const [isParentModalOpen, setIsParentModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // Edit Mode State
    const [editingParent, setEditingParent] = useState<ParentCategory | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Form States
    const [parentName, setParentName] = useState('');
    const [parentImage, setParentImage] = useState<File | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [categoryParentId, setCategoryParentId] = useState<string>('');
    const [categoryDescription, setCategoryDescription] = useState('');
    const [categoryImage, setCategoryImage] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Actions Dropdown State (Track which row has dropdown open)
    const [openActionId, setOpenActionId] = useState<number | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const actionDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsAddDropdownOpen(false);
            }
            if (actionDropdownRef.current && !actionDropdownRef.current.contains(event.target as Node)) {
                setOpenActionId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchParents = async () => {
        if (!token) return;
        try {
            const response = await fetch(endpoints.categories.parents, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            const data = await response.json();
            if (data.success) {
                setParents(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch parent categories', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        if (!token) return;
        setFetchingCategories(true);
        try {
            let url = endpoints.categories.all;
            if (activeTab !== 'all') {
                url = `${endpoints.categories.parents}/${activeTab}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            const data = await response.json();

            if (data.success) {
                if (activeTab === 'all') {
                    setCategories(data.data);
                } else {
                    setCategories(data.data.categories || []);
                }
            }
        } catch (error) {
            console.error('Failed to fetch categories', error);
            setCategories([]);
        } finally {
            setFetchingCategories(false);
        }
    };

    useEffect(() => {
        if (token) fetchParents();
    }, [token]);

    useEffect(() => {
        if (token) fetchCategories();
    }, [activeTab, token]);


    // --- Parent Category Handlers ---

    const openParentModal = (parent?: ParentCategory) => {
        if (parent) {
            setEditingParent(parent);
            setParentName(parent.name);
            setParentImage(null); // Reset file input
        } else {
            setEditingParent(null); // Create mode
            setParentName('');
            setParentImage(null);
        }
        setIsParentModalOpen(true);
        setIsAddDropdownOpen(false);
    };

    const handleSaveParentCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('name', parentName);
        if (parentImage) {
            formData.append('image', parentImage);
        }

        try {
            const url = editingParent
                ? `${endpoints.categories.parents}/${editingParent.id}`
                : endpoints.categories.parents;

            // Assuming the update API is POST method as per request
            const method = 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: formData
            });

            const data = await response.json();
            if (data.success || response.ok) {
                setIsParentModalOpen(false);
                setParentName('');
                setParentImage(null);
                setEditingParent(null);
                fetchParents();
                if (activeTab !== 'all' && editingParent && activeTab === editingParent.id) {
                    // If we edited the currently active parent, refresh title potentially? 
                    // Usually fetchParents handles the tabs, but components might need re-render.
                }
            } else {
                alert('Failed to save parent category');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteParent = async (parentId: number) => {
        if (!token || !window.confirm('Are you sure you want to delete this parent category?')) return;

        try {
            const response = await fetch(`${endpoints.categories.parents}/${parentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            if (response.ok) {
                if (activeTab === parentId) setActiveTab('all');
                fetchParents();
            } else {
                alert('Failed to delete parent category');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to delete');
        }
    };

    // --- Category Handlers ---

    const openCategoryModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setCategoryName(category.name);
            setCategoryParentId(category.parent_category_id ? String(category.parent_category_id) : '');
            setCategoryDescription(category.description || '');
            setCategoryImage(null);
        } else {
            setEditingCategory(null);
            setCategoryName('');
            setCategoryParentId('');
            setCategoryDescription('');
            setCategoryImage(null);
        }
        setIsCategoryModalOpen(true);
        setIsAddDropdownOpen(false);
        setOpenActionId(null);
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        if (!categoryParentId) {
            alert('Please select a parent category');
            return;
        }
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('name', categoryName);
        formData.append('parent_category_id', categoryParentId);
        if (categoryDescription) formData.append('description', categoryDescription);
        if (categoryImage) formData.append('image', categoryImage);

        try {
            const url = editingCategory
                ? `${endpoints.categories.all}/${editingCategory.id}`
                : endpoints.categories.all;

            // Assuming update is POST
            const method = 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: formData
            });
            const data = await response.json();
            if (data.success || response.ok) {
                setIsCategoryModalOpen(false);
                setCategoryName('');
                setCategoryParentId('');
                setCategoryDescription('');
                setCategoryImage(null);
                setEditingCategory(null);
                fetchCategories();
            } else {
                alert('Failed to save category');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (categoryId: number) => {
        if (!token || !window.confirm('Are you sure you want to delete this category?')) return;
        try {
            const response = await fetch(`${endpoints.categories.all}/${categoryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            if (response.ok) {
                fetchCategories();
            } else {
                alert('Failed to delete category');
            }
        } catch (e) {
            console.log(e);
            alert('Error deleting');
        }
    };


    if (loading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
    }

    // Identify current parent for Edit/Delete buttons in the header
    const currentParent = parents.find(p => p.id === activeTab);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                    {/* Parent Actions (Only show if a specific parent tab is active) */}
                    {activeTab !== 'all' && currentParent && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => openParentModal(currentParent)}
                                className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit Parent Category"
                            >
                                <Edit className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => handleDeleteParent(currentParent.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Delete Parent Category"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Add Category Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Add Category
                        <ChevronDown className={`h-4 w-4 transition-transform ${isAddDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isAddDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                            <div className="py-1">
                                <button
                                    onClick={() => openParentModal()}
                                    className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                                >
                                    Add Parent Category
                                </button>
                                <button
                                    onClick={() => openCategoryModal()}
                                    className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                                >
                                    Add Category
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${activeTab === 'all'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        All Categories
                    </button>
                    {parents.map((parent) => (
                        <button
                            key={parent.id}
                            onClick={() => setActiveTab(parent.id)}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === parent.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                        >
                            {parent.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Table (For All Tabs) */}
            {fetchingCategories ? (
                <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No categories found.</div>
            ) : (
                <div className="overflow-visible bg-white shadow-sm ring-1 ring-gray-200 rounded-xl">
                    <div className="overflow-x-auto overflow-y-visible">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Category</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                {category.image_url ? (
                                                    <img className="h-10 w-10 rounded-full object-cover" src={getOptimizedImageUrl(category.image_url)} alt={category.name} />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Img</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                            {category.description && (
                                                <div className="text-sm text-gray-500 truncate max-w-xs">{category.description}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{category.parent_category?.name || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${category.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {category.status === 1 ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenActionId(openActionId === category.id ? null : category.id);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </button>

                                                {openActionId === category.id && (
                                                    <div ref={actionDropdownRef} className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                                        <div className="py-1">
                                                            <button
                                                                onClick={() => openCategoryModal(category)}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            >
                                                                <Edit className="mr-3 h-4 w-4" /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setOpenActionId(null);
                                                                    handleDeleteCategory(category.id);
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                                            >
                                                                <Trash2 className="mr-3 h-4 w-4" /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Parent Category Modal */}
            <Modal isOpen={isParentModalOpen} onClose={() => setIsParentModalOpen(false)} title={editingParent ? "Edit Parent Category" : "Add Parent Category"}>
                <form onSubmit={handleSaveParentCategory} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            value={parentName}
                            onChange={(e) => setParentName(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Image (Optional)</label>
                        <input
                            type="file"
                            onChange={(e) => setParentImage(e.target.files ? e.target.files[0] : null)}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsParentModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Category Modal */}
            <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title={editingCategory ? "Edit Category" : "Add Category"}>
                <form onSubmit={handleSaveCategory} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Parent Category</label>
                        <select
                            value={categoryParentId}
                            onChange={(e) => setCategoryParentId(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            required
                        >
                            <option value="">Select Parent Category</option>
                            {parents.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                        <textarea
                            value={categoryDescription}
                            onChange={(e) => setCategoryDescription(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Image (Optional)</label>
                        <input
                            type="file"
                            onChange={(e) => setCategoryImage(e.target.files ? e.target.files[0] : null)}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
