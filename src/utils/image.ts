import { API_BASE_URL } from '../config';

export const getOptimizedImageUrl = (url: string | undefined | null): string | undefined => {
    if (!url) return undefined;

    // Fix JSON escaped slashes if they exist (though fetch handles this)
    let cleanUrl = url.replace(/\\\//g, '/');

    // Check if the URL is localhost but missing the port (common Laravel issue)
    // If API_BASE_URL has a port (e.g. 8000) and the image URL doesn't, we probably need to swap it.

    // Extract origin from API_BASE_URL (e.g., http://127.0.0.1:8000)
    try {
        const apiOrigin = new URL(API_BASE_URL).origin;
        const imageUrlObj = new URL(cleanUrl);

        // If image is localhost and default port 80, but API is on different port/host
        if ((imageUrlObj.hostname === 'localhost' || imageUrlObj.hostname === '127.0.0.1') && imageUrlObj.port === '') {
            if (apiOrigin.includes(':8000')) {
                return cleanUrl.replace(imageUrlObj.origin, apiOrigin);
            }
        }
    } catch (e) {
        // If URL parsing fails, return original
        return cleanUrl;
    }

    return cleanUrl;
};
