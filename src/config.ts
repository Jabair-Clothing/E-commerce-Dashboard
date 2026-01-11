export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.jabaibgroup.com/api';

export const endpoints = {
    login: `${API_BASE_URL}/login`,
    profile: `${API_BASE_URL}/profile`,
    dashboard: `${API_BASE_URL}/admin/dashboard`,
    users: {
        register: `${API_BASE_URL}/users/register`,
        delete: (id: number | string) => `${API_BASE_URL}/users/${id}`,
    },
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
    clients: {
        all: `${API_BASE_URL}/clints`,
        details: (id: number | string) => `${API_BASE_URL}/clints/all-info/${id}`,
    },
    shippingAddresses: {
        create: `${API_BASE_URL}/shipping-addresses`,
        update: (id: number | string) => `${API_BASE_URL}/shipping-addresses/${id}`,
        delete: (id: number | string) => `${API_BASE_URL}/shipping-addresses/${id}`,
    },
    contacts: {
        all: `${API_BASE_URL}/contact`,
        delete: (id: number | string) => `${API_BASE_URL}/contact/${id}`,
    },
};
