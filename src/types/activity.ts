export interface UserActivity {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

export interface Activity {
    id: number;
    log_name: string;
    description: string;
    subject_type: string | null;
    subject_id: string | null;
    causer_type: string | null;
    causer_id: string | null;
    properties: any | null;
    created_at: string;
    updated_at: string;
    user?: UserActivity; // Based on eager loading 'user' in backend
}

export interface ActivityResponse {
    success: boolean;
    status: number;
    message: string;
    data: Activity[];
    pagination?: {
        total_rows: number;
        current_page: number;
        per_page: number;
        total_pages: number;
        has_more_pages: boolean;
    };
}
