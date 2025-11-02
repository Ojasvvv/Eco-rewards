import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // ============ BUILD-TIME ENVIRONMENT VALIDATION ============
  // Only validate in production builds to prevent false errors in dev
  if (mode === 'production') {
    const requiredEnvVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID'
    ];

    const missing = requiredEnvVars.filter(varName => !env[varName]);
    
    if (missing.length > 0) {
      console.error('\n╔═══════════════════════════════════════════════════════════╗');
      console.error('║  ❌ BUILD FAILED: MISSING ENVIRONMENT VARIABLES          ║');
      console.error('╚═══════════════════════════════════════════════════════════╝\n');
      console.error('Missing required environment variables:\n');
      missing.forEach(varName => console.error(`   ✗ ${varName}`));
      console.error('\nPlease set these in:');
      console.error('  • Vercel Dashboard → Settings → Environment Variables');
      console.error('  • Or create a .env file locally (see ENV_SETUP.md)\n');
      console.error('Build cannot continue without Firebase configuration.\n');
      process.exit(1); // Stop build
    }
    
    console.log('\n✅ All required environment variables validated');
  }
  // ===========================================================

  return {
    plugins: [react()],
    server: {
      port: 5173, // Default Vite port
      host: true,
      // Proxy API requests in development
      // Option 1: Proxy to Vercel deployment (requires deployment)
      // Option 2: Use Vercel CLI (`vercel dev`) to run functions locally
      //   - Run `npx vercel dev` in a separate terminal
      //   - Then proxy to http://localhost:3000 (default Vercel dev port)
      proxy: {
        '/api': {
          target: process.env.VERCEL_DEV_URL || 'https://eco-rewards-wheat.vercel.app',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path, // Keep /api prefix
          ws: false, // Disable websocket proxying
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Log proxied requests for debugging
              if (process.env.DEBUG_PROXY) {
                console.log(`[Proxy] ${req.method} ${req.url} -> ${proxyReq.path}`);
              }
            });
            proxy.on('error', (err, req, _res) => {
              console.error('[Proxy Error]', err.message);
            });
          }
        }
      }
    },
    build: {
      rollupOptions: {
        input: {
          main: './index.html',
        }
      }
    },
    // Ensure service worker and manifest are copied to dist
    publicDir: 'public',
  };
})

