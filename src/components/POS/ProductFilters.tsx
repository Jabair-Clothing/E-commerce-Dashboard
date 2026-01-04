import React from 'react';
import type { ParentCategory, Category } from '../../types/pos';

interface ProductFiltersProps {
    parents: ParentCategory[];
    categories: Category[];
    selectedParentCategory: number | null;
    selectedCategory: number | null;
    handleParentCategoryChange: (id: number | null) => void;
    setSelectedCategory: (id: number | null) => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
    parents,
    categories,
    selectedParentCategory,
    selectedCategory,
    handleParentCategoryChange,
    setSelectedCategory
}) => {
    return (
        <div className="bg-white px-4 pt-3 pb-2 border-b space-y-3">
            {/* Parent Categories */}
            <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Departments</label>
                <div className="overflow-x-auto whitespace-nowrap scrollbar-hide pb-1">
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleParentCategoryChange(null)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${!selectedParentCategory ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                        >
                            All Departments
                        </button>
                        {parents.map((parent) => (
                            <button
                                key={parent.id}
                                onClick={() => handleParentCategoryChange(parent.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${selectedParentCategory === parent.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {parent.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sub Categories */}
            <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Categories</label>
                <div className="overflow-x-auto whitespace-nowrap scrollbar-hide pb-2">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedCategory ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            All Items
                        </button>
                        {categories.length === 0 ? (
                            <span className="text-sm text-gray-400 py-2 px-2 italic">
                                {selectedParentCategory ? 'No categories in this department' : 'No categories available'}
                            </span>
                        ) : (
                            categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    {cat.name}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
