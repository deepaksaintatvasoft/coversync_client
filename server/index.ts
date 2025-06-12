import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startDevServer() {
  try {
    const server = await createServer({
      root: resolve(__dirname, '../'),
      server: {
        port: 5000,
        host: '0.0.0.0',
        strictPort: true
      },
      configFile: resolve(__dirname, '../vite.config.ts')
    });

    await server.listen();
    console.log('🚀 CoverSync application running on http://0.0.0.0:5000');
  } catch (error) {
    console.error('Failed to start dev server:', error);
    process.exit(1);
  }
}

startDevServer();
