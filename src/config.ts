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
        create: `${API_BASE_URL}/products`,
        updateStatus: (id: number) => `${API_BASE_URL}/products/${id}/status`,
        getById: (id: number | string) => `${API_BASE_URL}/products/${id}`,
        skuAttributes: (id: number | string) => `${API_BASE_URL}/products/${id}/sku-attributes`,
        addSku: (id: number | string) => `${API_BASE_URL}/products/${id}/skus`,
        updateSku: (productId: number | string, skuId: number | string) => `${API_BASE_URL}/products/${productId}/skus/${skuId}`,
        deleteSkuData: (productId: number | string) => `${API_BASE_URL}/products/${productId}/sku-data`,
        delete: (id: number | string) => `${API_BASE_URL}/products/${id}`,
        images: {
            upload: (id: number | string) => `${API_BASE_URL}/products/${id}/images`,
            delete: (productId: number | string, imageId: number | string) => `${API_BASE_URL}/products/${productId}/images/${imageId}`,
            update: (productId: number | string, imageId: number | string) => `${API_BASE_URL}/products/${productId}/images/${imageId}`,
        }
    },
    coupons: {
        all: `${API_BASE_URL}/coupons`,
        create: `${API_BASE_URL}/coupons`,
        toggleStatus: (id: number | string) => `${API_BASE_URL}/coupons/toggle-status/${id}`,
        delete: (id: number | string) => `${API_BASE_URL}/coupons/${id}`,
        update: (id: number | string) => `${API_BASE_URL}/coupons/${id}`,
    },
    ratings: {
        all: `${API_BASE_URL}/ratings`,
        create: `${API_BASE_URL}/ratings`,
        toggleStatus: (id: number | string) => `${API_BASE_URL}/ratings/toggle-status/${id}`,
        delete: (id: number | string) => `${API_BASE_URL}/ratings/${id}`,
    }
};
