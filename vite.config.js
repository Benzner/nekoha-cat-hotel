import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'NekohaCatHotel',
                short_name: 'NekohaCat',
                description: 'Cat Hotel Room Reservation Management System',
                theme_color: '#FF8C42',
                background_color: '#FAFAFA',
                display: 'standalone',
                icons: [
                    {
                        src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐱</text></svg>',
                        sizes: '192x192',
                        type: 'image/svg+xml'
                    },
                    {
                        src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐱</text></svg>',
                        sizes: '512x512',
                        type: 'image/svg+xml'
                    }
                ]
            }
        })
    ]
})
