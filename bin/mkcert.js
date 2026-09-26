import { setupCertificates } from './mkcert/setup.js';

try {
  const directory = await setupCertificates();
  console.log(`Localhost certificates ready in ${directory}`);
  console.log('Start a Mosaic server, then connect to https://localhost:3000.');
  console.log('Restart running servers to load renewed certificates.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
