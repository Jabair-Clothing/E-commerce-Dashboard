export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const endpoints = {
    login: `${API_BASE_URL}/login`,
    profile: `${API_BASE_URL}/profile`,
    categories: {
        all: `${API_BASE_URL}/categories`,
        parents: `${API_BASE_URL}/categories/parents`,
    },
    attributes: {
        all: `${API_BASE_URL}/attributes`,
        values: `${API_BASE_URL}/attribute-values`,
    },
    products: {
        all: `${API_BASE_URL}/products`,
    }
};
