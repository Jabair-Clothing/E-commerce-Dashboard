export interface AttributeValue {
    id: number;
    attribute_id: number;
    name: string;
    code: string | null;
    created_at: string;
    updated_at: string;
}

export interface Attribute {
    id: number;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
    values: AttributeValue[];
}

export interface AttributeResponse {
    success: boolean;
    status: number;
    message: string;
    data: {
        current_page: number;
        data: Attribute[];
        total: number;
        // ... include other pagination fields if necessary
    };
}
