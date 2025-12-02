
/**
 * Parses the image_url field from the product data.
 * It handles both legacy (single string) and new (JSON array string) formats.
 * 
 * @param product The product object containing the image_url field.
 * @returns An array of image URLs.
 */
export const getAllImages = (product: any): string[] => {
    if (!product || !product.image_url) {
        return [];
    }

    try {
        // Try to parse as JSON array
        const parsed = JSON.parse(product.image_url);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        // If it's valid JSON but not an array (unlikely for our use case, but safe fallback)
        return [product.image_url];
    } catch (e) {
        // If parsing fails, it's likely a legacy simple string URL
        return [product.image_url];
    }
};

/**
 * Gets the primary image URL for a product.
 * This is the first image in the list, or the single image URL.
 * 
 * @param product The product object.
 * @returns The primary image URL string, or a placeholder if none exists.
 */
export const getPrimaryImage = (product: any): string => {
    const images = getAllImages(product);
    return images.length > 0 ? images[0] : ''; // Return empty string if no images, components usually handle empty src or show placeholder
};
