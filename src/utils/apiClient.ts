export class ApiError extends Error {
    response: Response;
    data?: any;

    constructor(response: Response, data?: any) {
        super(`API Error: ${response.status} ${response.statusText}`);
        this.name = 'ApiError';
        this.response = response;
        this.data = data;
    }
}

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = localStorage.getItem('token');

    const headers = new Headers(options.headers || {});

    // Add Authorization header if token exists and not already set
    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Ensure Accept header is set for JSON APIs usually
    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }

    // Default Content-Type to application/json if not set and body is not FormData
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);

        if (response.status === 401) {
            // Dispatch logout event
            window.dispatchEvent(new CustomEvent('auth:logout'));
            throw new ApiError(response, { message: 'Unauthorized' });
        }

        return response;
    } catch (error) {
        throw error;
    }
};
