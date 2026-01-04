export interface SkuAttribute {
    attribute_id: number;
    attribute_name: string;
    value_id: number;
    value_name: string;
    value_code: string;
}

export interface ProductSku {
    id: number;
    sku: string;
    price: string;
    quantity: number;
    attributes: SkuAttribute[];
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
