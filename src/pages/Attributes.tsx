import React, { useState } from 'react';
import { Plus, Loader2, Edit, Trash2, X, Palette, Hash } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../config';
import type { Attribute, AttributeValue } from '../types/attribute';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/apiClient';
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

export const Attributes: React.FC = () => {
    const queryClient = useQueryClient();
    const { token } = useAuth();

    // Modal States
    const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
    const [isValueModalOpen, setIsValueModalOpen] = useState(false);

    // Filter/Edit States
    const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
    const [editingValue, setEditingValue] = useState<AttributeValue | null>(null);

    // Form States
    const [attributeName, setAttributeName] = useState('');

    const [valueName, setValueName] = useState('');
    const [valueCode, setValueCode] = useState('#000000');
    const [selectedAttributeId, setSelectedAttributeId] = useState<string>('');

    // --- Queries ---
    const { data: attributesData, isLoading } = useQuery({
        queryKey: ['attributes'],
        queryFn: async () => {
            const res = await fetchWithAuth(endpoints.attributes.all);
            return res.json();
        },
        enabled: !!token,
    });

    const attributes: Attribute[] = attributesData?.success ? (attributesData.data.data || []) : [];

    // --- Mutations ---

    // Attribute Mutations
    const saveAttributeMutation = useMutation({
        mutationFn: async () => {
            const url = editingAttribute
                ? `${endpoints.attributes.all}/${editingAttribute.id}`
                : endpoints.attributes.all;

            const method = editingAttribute ? 'PUT' : 'POST';

            const response = await fetchWithAuth(url, {
                method,
                body: JSON.stringify({ name: attributeName })
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success || data.id) { // Accept if success flag or ID returned
                setIsAttributeModalOpen(false);
                queryClient.invalidateQueries({ queryKey: ['attributes'] });
            } else {
                alert('Failed to save attribute');
            }
        },
        onError: () => alert('An error occurred')
    });

    const deleteAttributeMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetchWithAuth(`${endpoints.attributes.all}/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attributes'] });
        },
        onError: () => alert('Failed to delete')
    });

    // Value Mutations
    const saveValueMutation = useMutation({
        mutationFn: async () => {
            const url = editingValue
                ? `${endpoints.attributes.values}/${editingValue.id}`
                : endpoints.attributes.values;

            const method = editingValue ? 'PUT' : 'POST';

            const body: any = {
                name: valueName,
            };

            if (!editingValue) {
                body.attribute_id = selectedAttributeId;
            }

            if (valueCode) {
                body.code = valueCode;
            }

            const response = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(body)
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success || data.id) {
                setIsValueModalOpen(false);
                queryClient.invalidateQueries({ queryKey: ['attributes'] });
            } else {
                alert('Failed to save value');
            }
        },
        onError: () => alert('An error occurred')
    });

    const deleteValueMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetchWithAuth(`${endpoints.attributes.values}/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attributes'] });
        },
        onError: () => alert('Failed to delete')
    });


    // --- Attribute Handlers ---

    const openAttributeModal = (attr?: Attribute) => {
        if (attr) {
            setEditingAttribute(attr);
            setAttributeName(attr.name);
        } else {
            setEditingAttribute(null);
            setAttributeName('');
        }
        setIsAttributeModalOpen(true);
    };

    const handleSaveAttribute = (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        saveAttributeMutation.mutate();
    };

    const handleDeleteAttribute = (id: number) => {
        if (!token || !window.confirm('Delete this attribute?')) return;
        deleteAttributeMutation.mutate(id);
    };

    // --- Attribute Value Handlers ---

    const openValueModal = (attrId?: number, val?: AttributeValue) => {
        // If opening for a specific attribute (adding new value)
        if (attrId) {
            setSelectedAttributeId(String(attrId));
        } else {
            // If completely new (from global button, though typically context based)
            setSelectedAttributeId(attributes.length > 0 ? String(attributes[0].id) : '');
        }

        if (val) {
            setEditingValue(val);
            setValueName(val.name);
            setValueCode(val.code || '#000000');
            // If editing, make sure the attribute ID matches the value's parent
            setSelectedAttributeId(String(val.attribute_id));
        } else {
            setEditingValue(null);
            setValueName('');
            setValueCode('#000000');
        }
        setIsValueModalOpen(true);
    };

    const handleSaveValue = (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        saveValueMutation.mutate();
    };

    const handleDeleteValue = (id: number) => {
        if (!token || !window.confirm('Delete this variation?')) return;
        deleteValueMutation.mutate(id);
    };


    if (isLoading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Attributes & Variations</h1>
                <button
                    onClick={() => openAttributeModal()}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Add Attribute
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {attributes.map((attr) => (
                    <div key={attr.id} className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{attr.name}</h3>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Slug: {attr.slug}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => openAttributeModal(attr)}
                                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-white rounded-lg transition-colors"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteAttribute(attr.id)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                <div className="h-6 w-px bg-gray-300 mx-2" />
                                <button
                                    onClick={() => openValueModal(attr.id)}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Variation
                                </button>
                            </div>
                        </div>

                        {/* Values List */}
                        <div className="p-6">
                            {attr.values && attr.values.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                    {attr.values.map((val) => (
                                        <div key={val.id} className="group relative flex items-center gap-3 rounded-lg border border-gray-200 pl-3 pr-2 py-2 hover:border-primary-300 hover:shadow-sm transition-all bg-white">
                                            {/* Preview Code if color */}
                                            {val.code && (
                                                <div
                                                    className="h-6 w-6 rounded-full border border-gray-200 shadow-sm"
                                                    style={{ backgroundColor: val.code }}
                                                    title={val.code}
                                                />
                                            )}

                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{val.name}</span>
                                                {val.code && <span className="text-[10px] text-gray-400 font-mono">{val.code}</span>}
                                            </div>

                                            <div className="ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity border-l border-gray-100 pl-2">
                                                <button
                                                    onClick={() => openValueModal(attr.id, val)}
                                                    className="p-1 text-gray-400 hover:text-primary-600"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteValue(val.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No variations added yet.</p>
                            )}
                        </div>
                    </div>
                ))}

                {attributes.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <Palette className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No Attributes Found</h3>
                        <p className="text-gray-500 mt-1">Get started by creating a new attribute like "Color" or "Size".</p>
                    </div>
                )}
            </div>

            {/* Attribute Modal */}
            <Modal isOpen={isAttributeModalOpen} onClose={() => setIsAttributeModalOpen(false)} title={editingAttribute ? "Edit Attribute" : "New Attribute"}>
                <form onSubmit={handleSaveAttribute} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Attribute Name</label>
                        <input
                            type="text"
                            value={attributeName}
                            onChange={(e) => setAttributeName(e.target.value)}
                            placeholder="e.g. Color, Size, Material"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsAttributeModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button
                            type="submit"
                            disabled={saveAttributeMutation.isPending}
                            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            {saveAttributeMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Value/Variation Modal */}
            <Modal isOpen={isValueModalOpen} onClose={() => setIsValueModalOpen(false)} title={editingValue ? "Edit Variation" : "Add Variation"}>
                <form onSubmit={handleSaveValue} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Attribute Type</label>
                        <select
                            value={selectedAttributeId}
                            onChange={(e) => setSelectedAttributeId(e.target.value)}
                            disabled={!!editingValue} // Disable changing parent when editing (optional UX choice)
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-gray-50"
                        >
                            {attributes.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Variation Name</label>
                        <input
                            type="text"
                            value={valueName}
                            onChange={(e) => setValueName(e.target.value)}
                            placeholder="e.g. Red, XL, Cotton"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color Code (Optional)</label>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <input
                                    type="color"
                                    value={valueCode}
                                    onChange={(e) => setValueCode(e.target.value)}
                                    className="h-10 w-10 p-1 rounded cursor-pointer border border-gray-200"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="relative rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Hash className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        type="text"
                                        value={valueCode}
                                        onChange={(e) => setValueCode(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-2 border"
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Pick a color if this variation represents a color (e.g. #FF0000 for Red).</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsValueModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button
                            type="submit"
                            disabled={saveValueMutation.isPending}
                            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            {saveValueMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Modal>

        </div>
    );
};
