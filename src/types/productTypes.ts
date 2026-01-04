export interface ProductImage {
    id: number;
    url: string;
    is_primary: boolean;
    sort_order?: number;
}

export interface SkuAttribute {
    attribute_id: number;
    attribute_name: string;
    value_id: number;
    value_name: string;
    value_code: string | null;
    product_image_id: number | null;
    image_url: string | null;
}

export interface SkuAttributeOption {
    sku_attribute_id: number;
    attribute_name: string;
    value_name: string;
    product_image_id: number | null;
}

export interface AttributeValue {
    id: number;
    attribute_id: number;
    name: string;
    code: string | null;
}

export interface Attribute {
    id: number;
    name: string;
    slug: string;
    values: AttributeValue[];
}

export interface ProductSku {
    id: number;
    sku: string;
    price: string;
    quantity: number;
    image: string | null;
    attributes: SkuAttribute[];
    discount_price?: string | number | null;
}

export interface ProductDetails {
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

export interface NewVariant {
    id: string;
    price: string;
    quantity: string;
    discount_price: string;
    attributes: Record<number, number>;
    image: File | null;
}

export interface Category {
    id: number;
    name: string;
    image_url: string | null;
}

export interface ParentCategory {
    id: number; // Changed from number | string to number to match usage
    name: string;
    image_url: string | null;
}
