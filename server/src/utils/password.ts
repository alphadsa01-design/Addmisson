import crypto from 'crypto';

/**
 * Cross-platform password hashing using Node.js native crypto scrypt algorithm.
 * 100% compatible across Vercel Serverless, AWS Lambda, Docker, Linux, macOS, and Windows.
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
 * Cross-platform password verification using Node.js native crypto timingSafeEqual.
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  if (!hash || !hash.includes(':')) return false;

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
