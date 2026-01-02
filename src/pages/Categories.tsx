import React from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';

const categories = [
    { id: 1, name: 'Electronics', count: 124, image: 'https://images.unsplash.com/photo-1498049381529-5f2694209e5a?auto=format&fit=crop&q=80&w=300' },
    { id: 2, name: 'Clothing', count: 350, image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=300' },
    { id: 3, name: 'Home & Garden', count: 89, image: 'https://images.unsplash.com/photo-1484154218962-a1c002085d2f?auto=format&fit=crop&q=80&w=300' },
    { id: 4, name: 'Books', count: 45, image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=300' },
    { id: 5, name: 'Beauty', count: 76, image: 'https://images.unsplash.com/photo-1596462502278-27bfdd403348?auto=format&fit=crop&q=80&w=300' },
    { id: 6, name: 'Sports', count: 62, image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=300' },
];

export const Categories: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                <button className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
                    <Plus className="h-4 w-4" />
                    Add Category
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                    <div key={category.id} className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md">
                        <div className="aspect-w-16 aspect-h-9 h-40 w-full overflow-hidden bg-gray-100">
                            <img
                                src={category.image}
                                alt={category.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <h3 className="text-lg font-bold">{category.name}</h3>
                            <p className="text-sm text-gray-200">{category.count} Products</p>
                        </div>
                        <button className="absolute top-2 right-2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 backdrop-blur-sm">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
