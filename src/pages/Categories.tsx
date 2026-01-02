import React, { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, Loader2 } from 'lucide-react';
import { endpoints } from '../config';
import type { Category, ParentCategory } from '../types/category';

export const Categories: React.FC = () => {
    const [parents, setParents] = useState<ParentCategory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeTab, setActiveTab] = useState<number | 'all'>('all');
    const [loading, setLoading] = useState(true);
    const [fetchingCategories, setFetchingCategories] = useState(false);

    // Fetch Parent Categories on mount
    useEffect(() => {
        const fetchParents = async () => {
            try {
                const response = await fetch(endpoints.categories.parents);
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
        fetchParents();
    }, []);

    // Fetch Categories when activeTab changes
    useEffect(() => {
        const fetchCategories = async () => {
            setFetchingCategories(true);
            try {
                let url = endpoints.categories.all;
                if (activeTab !== 'all') {
                    url = `${endpoints.categories.parents}/${activeTab}`;
                }

                const response = await fetch(url);
                const data = await response.json();

                if (data.success) {
                    if (activeTab === 'all') {
                        setCategories(data.data);
                    } else {
                        // The specific parent endpoint returns data.data.categories
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

        fetchCategories();
    }, [activeTab]);

    if (loading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                <button className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
                    <Plus className="h-4 w-4" />
                    Add Category
                </button>
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

            {/* Content Grid */}
            {fetchingCategories ? (
                <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No categories found.</div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                        <div key={category.id} className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md">
                            <div className="aspect-w-16 aspect-h-9 h-40 w-full overflow-hidden bg-gray-100 relative">
                                {category.image_url ? (
                                    <img
                                        src={category.image_url}
                                        alt={category.name}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-300">
                                        <span className="text-xs">No Image</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                <h3 className="text-lg font-bold">{category.name}</h3>
                                {category.parent_category && (
                                    <p className="text-sm text-gray-200 opacity-80">{category.parent_category.name}</p>
                                )}
                            </div>
                            <button className="absolute top-2 right-2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 backdrop-blur-sm">
                                <MoreHorizontal className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
