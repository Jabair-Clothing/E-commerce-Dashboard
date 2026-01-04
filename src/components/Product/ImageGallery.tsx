import React from 'react';

import { Star, GripVertical, Trash2, Upload } from 'lucide-react';
import type { ProductImage, SkuAttributeOption } from '../../types/productTypes';

interface ImageGalleryProps {
    images: ProductImage[];
    skuAttributes: SkuAttributeOption[];
    selectedSkuAttrId: number | '';
    isUploading: boolean;
    onReorder: (newOrder: ProductImage[]) => void;
    onSetPrimary: (id: number) => void;
    onDelete: (id: number) => void;
    onSkuAttrChange: (val: number | '') => void;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DraggableImageCard = ({ img, onSetPrimary, onDelete }: { img: ProductImage, onSetPrimary: (id: number) => void, onDelete: (id: number) => void }) => {


    return (
        <div
            className="relative group aspect-square rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm"
        >
            <img src={img.url} alt="Product" className="w-full h-full object-cover" />

            {/* Primary Badge */}
            {img.is_primary && (
                <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded shadow-sm z-10">Primary</div>
            )}

            {/* Drag Handle (Visual Only) */}
            <div
                className="absolute top-2 right-2 bg-white/80 p-1 rounded cursor-grab active:cursor-grabbing hover:bg-white transition-colors z-10"
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
        </div>
    );
};

export const ImageGallery: React.FC<ImageGalleryProps> = ({
    images,
    skuAttributes,
    selectedSkuAttrId,
    isUploading,
    // onReorder,
    onSetPrimary,
    onDelete,
    onSkuAttrChange,
    onUpload
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
                <span className="text-xs text-gray-500">Drag to reorder</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {images.map((img) => (
                    <DraggableImageCard
                        key={img.id}
                        img={img}
                        onSetPrimary={onSetPrimary}
                        onDelete={onDelete}
                    />
                ))}
            </div>

            <div className="mt-4 space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Link to Variant (Optional)
                    </label>
                    <select
                        value={selectedSkuAttrId}
                        onChange={(e) => onSkuAttrChange(Number(e.target.value) || '')}
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
                        onChange={onUpload}
                        disabled={isUploading}
                    />
                    <label
                        htmlFor="image-upload"
                        className={`flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-gray-50 transition-colors cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Upload className="h-6 w-6 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-600">
                            {isUploading ? 'Uploading...' : 'Click to Upload New Image'}
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
};
