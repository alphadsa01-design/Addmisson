import crypto from 'crypto';
import argon2 from 'argon2';

/**
 * Robust password hashing using Node.js native crypto scrypt algorithm.
 * 100% cross-platform compatibility across Vercel, AWS Lambda, Docker, Linux, macOS, and Windows.
 */
export const hashPassword = async (password: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
};

/**
 * Robust password verification supporting both Node scrypt and argon2 legacy hashes.
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  if (!hash) return false;

  // 1. Argon2 hash fallback check
  if (hash.startsWith('$argon2')) {
    try {
      return await argon2.verify(hash, password);
    } catch (e) {
      console.warn('Argon2 native verification fallback error:', e);
      return false;
    }
  }

  // 2. Scrypt hash verification
  if (!hash.includes(':')) return false;

  return new Promise((resolve) => {
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        const keyBuffer = Buffer.from(key, 'hex');
        resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
      } catch (e) {
        resolve(false);
      }
    });
  });
};
