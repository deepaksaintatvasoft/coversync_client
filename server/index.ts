import { spawn } from 'child_process';
import path from 'path';

console.log('Starting frontend-only CoverSync application...');

// Start the Vite development server for the frontend
const viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5000'], {
  cwd: path.join(process.cwd(), 'client'),
  stdio: 'inherit',
});

viteProcess.on('error', (error) => {
  console.error('Failed to start Vite:', error);
  process.exit(1);
});

viteProcess.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
  process.exit(code || 0);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  viteProcess.kill();
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  viteProcess.kill();
});