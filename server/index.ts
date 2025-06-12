// Frontend-only application - this file runs Vite dev server
import { spawn } from 'child_process';

console.log('Starting CoverSync Frontend Application...');

const viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5000'], {
  stdio: 'inherit',
  cwd: process.cwd().replace('/server', '')
});

viteProcess.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
});

process.on('SIGINT', () => {
  viteProcess.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  viteProcess.kill();
  process.exit();
});