import { createServer } from 'vite';

async function startDevServer() {
  const server = await createServer({
    configFile: './vite.config.ts',
    server: {
      host: '0.0.0.0',
      port: 5173
    }
  });
  
  await server.listen();
  server.printUrls();
}

startDevServer().catch(console.error);