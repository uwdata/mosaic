import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

export function certificateDirectory(platform = process.platform, env = process.env, home = homedir()) {
  const join = platform === 'win32' ? path.win32.join : path.posix.join;
  const config = platform === 'win32' ? env.APPDATA
    : platform === 'darwin' ? home && join(home, 'Library', 'Application Support')
    : env.XDG_CONFIG_HOME || (home && join(home, '.config'));
  return config ? join(config, 'mosaic', 'https') : undefined;
}

export function certificatePair(directory) {
  if (!directory) return;
  const cert = path.join(directory, 'localhost.pem');
  const key = path.join(directory, 'localhost-key.pem');
  return existsSync(cert) && existsSync(key) ? { cert, key } : undefined;
}

export function findCertificates(local = process.cwd(), shared = certificateDirectory()) {
  return certificatePair(local) || certificatePair(shared);
}
