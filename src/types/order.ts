export interface OrderDetailsResponse {
    success: boolean;
    status: number;
    message: string;
    data: {
        order: OrderSegment;
        user: UserSegment;
        shipping_address: ShippingAddressSegment | null;
        coupon: any | null;
        order_items: OrderItemSegment[];
        payments: PaymentSegment[];
    };
    errors: any | null;
}

export interface OrderSegment {
    order_id: number;
    user_id: string;
    shipping_id: string | null;
    user_name: string | null;
    user_phone: string | null;
    address: string | null;
    invoice_code: string;
    status: string; // The API returns string "0"
    status_change_desc: string | null;
    item_subtotal: string;
    shipping_charge: string;
    total_amount: string;
    discount: string;
    order_description: string;
    created_at: string;
}

export interface UserSegment {
    user_id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
}

export interface ShippingAddressSegment {
    shipping_id: number;
    f_name: string;
    l_name: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
}

export interface OrderItemSegment {
    product_id: number;
    name: string;
    slug: string;
    product_sku_id: number;
    quantity: string;
    price: string;
    image: {
        id: number;
        product_id: number;
        image_path: string;
        image_url: string;
        is_primary: number;
    } | null;
    attributes: {
        attribute_id: number;
        attribute_name: string;
        attribute_value_id: number;
        attribute_value_name: string;
        attribute_value_code: string;
    }[];
    attributes_text: string;
}

export interface PaymentSegment {
    payment_id: number;
    status: string;
    amount: string;
    paid_amount: string;
    payment_type: string;
    transaction_id: string | null;
    phone: string | null;
    due_amount: number;
}
