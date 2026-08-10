// Automatically glob all image assets from ../assets/images/ and subdirectories
const localImagesGlob = import.meta.glob('../assets/images/**/*.{png,jpg,jpeg,gif,svg}', { eager: true });

export function getCharacterImage(imagePath) {
    if (!imagePath) return '';

    // Return external URLs directly
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    const cleanInput = imagePath.toLowerCase().replace(/\\/g, '/');
    const filename = cleanInput.split('/').pop();

    // Exact or relative path match if specified
    for (const globPath in localImagesGlob) {
        const lowerGlob = globPath.toLowerCase();
        if (lowerGlob.endsWith(cleanInput) || lowerGlob === cleanInput) {
            return localImagesGlob[globPath].default || localImagesGlob[globPath];
        }
    }

    // Prioritize searching inside the /characters/ directory
    for (const globPath in localImagesGlob) {
        const lowerGlob = globPath.toLowerCase();
        if (lowerGlob.includes('/characters/')) {
            const globFilename = lowerGlob.split('/').pop();
            if (globFilename === filename) {
                return localImagesGlob[globPath].default || localImagesGlob[globPath];
            }
        }
    }

    // Fallback to searching anywhere in localImagesGlob
    for (const globPath in localImagesGlob) {
        const lowerGlob = globPath.toLowerCase();
        const globFilename = lowerGlob.split('/').pop();
        if (globFilename === filename) {
            return localImagesGlob[globPath].default || localImagesGlob[globPath];
        }
    }

    return imagePath;
}
