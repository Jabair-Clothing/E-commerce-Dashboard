export interface ParentCategory {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    status: number;
    created_at: string;
    updated_at: string;
    image_url?: string;
}

export interface Category {
    id: number;
    parent_category_id: number;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    status: number;
    created_at: string;
    updated_at: string;
    image_url?: string;
    parent_category?: ParentCategory;
}
