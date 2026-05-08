import { logger } from '../utils/logger';
import prisma from '../utils/prisma';

export interface GPUMetrics {
  gpuId: string;
  utilization: number;
  memoryUsed: number;
  temperature: number;
  powerUsage: number;
  timestamp: Date;
}

export class MonitoringService {
  async collectMetrics(gpuId: string): Promise<GPUMetrics | null> {
    try {
      // Simulated metrics collection (would integrate with DCGM in production)
      const metrics: GPUMetrics = {
        gpuId,
        utilization: Math.random() * 100,
        memoryUsed: Math.random() * 16384,
        temperature: 40 + Math.random() * 40,
        powerUsage: 150 + Math.random() * 150,
        timestamp: new Date()
      };

      logger.debug(`Collected metrics for GPU ${gpuId}`, metrics);
      return metrics;
    } catch (error) {
      logger.error(`Failed to collect metrics for GPU ${gpuId}:`, error);
      return null;
    }
  }

  async storeMetrics(metrics: GPUMetrics): Promise<void> {
    // In production, this would store to TimeSeries DB (InfluxDB/TimescaleDB)
    logger.info(`Storing metrics for GPU ${metrics.gpuId}`);
  }

  async getGPUHealth(gpuId: string): Promise<{ status: string; issues: string[] }> {
    const metrics = await this.collectMetrics(gpuId);
    
    if (!metrics) {
      return { status: 'unknown', issues: ['Unable to collect metrics'] };
    }

    const issues: string[] = [];
    
    if (metrics.temperature > 80) {
      issues.push('High temperature detected');
    }
    if (metrics.utilization > 95) {
      issues.push('High utilization');
    }
    if (metrics.powerUsage > 280) {
      issues.push('High power consumption');
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'warning',
      issues
    };
  }
}

export const monitoringService = new MonitoringService();
