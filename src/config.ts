export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

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
        addSku: (id: string | number) => `${API_BASE_URL}/products/${id}/skus`,
        deleteSku: (id: string | number) => `${API_BASE_URL}/product-skus/${id}`,
        deleteImage: (id: number | string) => `${API_BASE_URL}/product-images/${id}`,
        delete: (id: number | string) => `${API_BASE_URL}/ratings/${id}`,
    },
    orderInfo: {
        get: `${API_BASE_URL}/orderinfo`,
        update: `${API_BASE_URL}/orderinfo`,
    },
    orders: {
        all: `${API_BASE_URL}/orders`,
        place: `${API_BASE_URL}/orders/place-order`,
        updateStatus: (id: number | string) => `${API_BASE_URL}/orders/update-status/${id}`,
        delete: (id: number | string) => `${API_BASE_URL}/orders/${id}`,
        getById: (id: number | string) => `${API_BASE_URL}/orders/${id}`,
        addProduct: (id: number | string) => `${API_BASE_URL}/orders/add-product/${id}`,
        removeProduct: (orderId: number | string, productId: number | string) => `${API_BASE_URL}/orders/products/${orderId}/remove/${productId}`,
        updateQuantity: (orderId: number | string, productId: number | string) => `${API_BASE_URL}/orders/products/${orderId}/update-quantity/${productId}`,
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
    transitions: {
        all: `${API_BASE_URL}/transiions`,
    },
    activities: {
        all: `${API_BASE_URL}/activitys`,
    },
    payments: {
        updateStatus: (id: number | string) => `${API_BASE_URL}/payments/update-status/${id}`,
        updatePaidAmount: (id: number | string) => `${API_BASE_URL}/payments/update-paid-amount/${id}`,
    },
    contacts: {
        all: `${API_BASE_URL}/contact`,
        delete: (id: number | string) => `${API_BASE_URL}/contact/${id}`,
    }
};
