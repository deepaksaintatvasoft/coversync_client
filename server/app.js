import { spawn } from 'child_process';

const viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5000'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

viteProcess.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
});

process.on('SIGINT', () => {
  viteProcess.kill();
  process.exit();
});

console.log('Starting CoverSync frontend application...');