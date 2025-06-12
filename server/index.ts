import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting CoverSync Frontend Application on http://localhost:5000 ...');

const clientRoot = resolve(__dirname, '../'); // root where vite.config.ts exists

const viteProcess = spawn('npx vite --host localhost --port 5000', {
  stdio: 'inherit',
  cwd: clientRoot,
  shell: true,
});

viteProcess.on('close', (code) => {
  console.log(`🛑 Vite process exited with code ${code}`);
});

['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    viteProcess.kill();
    process.exit();
  });
});
