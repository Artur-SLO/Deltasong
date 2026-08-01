// Automatically glob all image assets from ../assets/images/
const localImagesGlob = import.meta.glob('../assets/images/*.{png,jpg,jpeg,gif,svg}', { eager: true });

export function getCharacterImage(imagePath) {
    if (!imagePath) return '';
    
    // Return external URLs directly
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    const filename = imagePath.split('/').pop().toLowerCase();
    
    for (const path in localImagesGlob) {
        const pathFilename = path.split('/').pop().toLowerCase();
        if (pathFilename === filename) {
            return localImagesGlob[path].default || localImagesGlob[path];
        }
    }
    
    return imagePath;
}
