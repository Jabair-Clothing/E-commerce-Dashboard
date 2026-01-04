export interface SkuAttribute {
    id: number;
    product_sku_id: number;
    attribute_id: number;
    attribute_value_id: number;
    attribute: { name: string };
    attribute_value: { name: string };
}

export interface ProductSku {
    id: number;
    sku: string;
    price: string;
    quantity: number;
    sku_attributes: SkuAttribute[];
}

export interface Product {
    id: number;
    name: string;
    price: string;
    primary_image: string | null;
    stock_quantity: number;
    category: { id: number; name: string };
    parent_category: { id: number; name: string } | null;
    skus?: ProductSku[];
}

export interface CartItem extends Product {
    cartQuantity: number;
    product_sku_id?: number | null;
    variant_description?: string;
    variant_price?: string;
}

export interface Category {
    id: number;
    name: string;
    image_url: string | null;
}

export interface ParentCategory {
    id: number;
    name: string;
    image: string | null;
}

export interface OrderInfo {
    vat: string;
    inside_dhaka: number;
    outside_dhaka: number;
    bkash_changed: string;
}
