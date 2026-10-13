import crypto from 'node:crypto';
import type { Request } from 'express';
import { UAParser } from 'ua-parser-js';

export interface ParsedUserAgent {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browserName: string;
  osName: string;
}

/**
 * Extracts and structures Device Type, Browser, and OS from user-agent header.
 */
export const parseUserAgent = (userAgentString?: string): ParsedUserAgent => {
  if (!userAgentString) {
    return {
      deviceType: 'desktop',
      browserName: 'Unknown Browser',
      osName: 'Unknown OS',
    };
  }

  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  // Determine device type
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  const rawType = result.device.type;

  if (rawType === 'mobile' || rawType === 'tablet') {
    deviceType = rawType;
  } else if (
    result.os.name === 'iOS' ||
    result.os.name === 'Android' ||
    result.os.name === 'Windows Phone'
  ) {
    deviceType = 'mobile';
  } else {
    deviceType = 'desktop';
  }

  // Determine Browser Name with major version if available
  const browserName = result.browser.name
    ? `${result.browser.name}${result.browser.major ? ' ' + result.browser.major : ''}`
    : 'Unknown Browser';

  // Determine OS Name with version if available
  const osName = result.os.name
    ? `${result.os.name}${result.os.version ? ' ' + result.os.version : ''}`
    : 'Unknown OS';

  return {
    deviceType,
    browserName,
    osName,
  };
};

/**
 * Captures the client's IP address.
 * Prioritizes Vercel's standard 'x-forwarded-for' reverse proxy header,
 * with fallbacks to standard Express request IP and socket address.
 */
export const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    // In multi-proxy chains, the client's real IP is the first entry
    const clientIp = forwarded.split(',')[0].trim();
    return sanitizeIp(clientIp);
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return sanitizeIp(forwarded[0].trim());
  }

  const fallbackIp = req.ip || req.socket.remoteAddress || 'Unknown IP';
  return sanitizeIp(fallbackIp);
};

/**
 * Sanitizes IPv6 localhost loopback strings into clean IPv4 representation.
 */
const sanitizeIp = (ip: string): string => {
  if (!ip) return 'Unknown IP';
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
};

/**
 * Computes a SHA-256 hash of the authorization token for secure session mapping.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
};
