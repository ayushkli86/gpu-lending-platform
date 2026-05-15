import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

class CacheService {
  private client: RedisClientType | null = null;
  private connected = false;

  async connect(): Promise<void> {
    if (!process.env.REDIS_URL) {
      logger.warn('REDIS_URL not set — caching disabled');
      return;
    }
    try {
      this.client = createClient({ url: process.env.REDIS_URL }) as RedisClientType;
      this.client.on('error', (err) => logger.error('Redis error', { err }));
      await this.client.connect();
      this.connected = true;
      logger.info('Redis connected');
    } catch (err) {
      logger.warn('Redis unavailable — caching disabled', { err });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected || !this.client) return null;
    try {
      const val = await this.client.get(key);
      return val ? (JSON.parse(val) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    if (!this.connected || !this.client) return;
    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // non-fatal
    }
  }

  async del(key: string): Promise<void> {
    if (!this.connected || !this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // non-fatal
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.connected || !this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length) await this.client.del(keys);
    } catch {
      // non-fatal
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const cache = new CacheService();
