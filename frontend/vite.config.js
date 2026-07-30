import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/Deltasong/',

    build: {
        chunkSizeWarningLimit: 800,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('@mantine') || id.includes('@tabler')) {
                            return 'vendor-ui';
                        }
                        return 'vendor';
                    }
                }
            }
        }
    }
})
