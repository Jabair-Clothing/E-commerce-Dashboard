import React from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

const products = [
    { id: 1, name: 'Premium Wireless Headphones', category: 'Electronics', price: '$299.00', stock: 45, status: 'In Stock' },
    { id: 2, name: 'Ergonomic Office Chair', category: 'Furniture', price: '$199.00', stock: 12, status: 'Low Stock' },
    { id: 3, name: 'Mechanical Keyboard', category: 'Electronics', price: '$149.00', stock: 0, status: 'Out of Stock' },
    { id: 4, name: 'Smart Fitness Watch', category: 'Wearables', price: '$89.00', stock: 120, status: 'In Stock' },
    { id: 5, name: 'Designer Coffee Mug', category: 'Home', price: '$15.00', stock: 50, status: 'In Stock' },
];

export const Products: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                <button className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
                    <Plus className="h-4 w-4" />
                    Add Product
                </button>
            </div>

            <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 p-4">
                    <div className="relative max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="block w-full rounded-lg border-gray-300 pl-10 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{product.category}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{product.price}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{product.stock} units</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${product.stock === 0 ? 'bg-red-100 text-red-800' :
                                            product.stock < 20 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="text-gray-400 hover:text-primary-600 transition-colors"><Edit className="h-4 w-4" /></button>
                                            <button className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <p>Showing 5 of 50 results</p>
                        <div className="flex gap-2">
                            <button className="disabled:opacity-50 hover:text-gray-900">Previous</button>
                            <button className="disabled:opacity-50 hover:text-gray-900">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
