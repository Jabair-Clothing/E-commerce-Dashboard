export interface PaymentDetails {
    order_id: string;
    invoice_code: string;
    status: string;
    total_amount: string;
    padi_amount: string | null;
    paid_amount?: number;
    due_amount: number;
    payment_type: string;
    trxed: string | null;
    phone: string | null;
}

export interface Transition {
    transition_id: number;
    payment_id: string;
    amount: string;
    payment_details: PaymentDetails;
    created_at: string;
    updated_at: string;
}

export interface TransitionResponse {
    success: boolean;
    status: number;
    message: string;
    data: Transition[];
    errors: any | null;
    pagination?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
        from: number;
        to: number;
    };
}
