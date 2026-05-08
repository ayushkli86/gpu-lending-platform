import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GPUMetricsData {
  gpuId: string;
  utilization: number;
  memoryUsed: number;
  memoryTotal: number;
  temperature: number;
  powerDraw: number;
  fanSpeed?: number;
  clockSpeed?: number;
}

export class MetricsService {
  // Store GPU metrics
  async storeMetrics(data: GPUMetricsData) {
    return prisma.gPUMetrics.create({
      data: {
        gpuId: data.gpuId,
        utilization: data.utilization,
        memoryUsed: data.memoryUsed,
        memoryTotal: data.memoryTotal,
        temperature: data.temperature,
        powerDraw: data.powerDraw,
        fanSpeed: data.fanSpeed,
        clockSpeed: data.clockSpeed,
      },
    });
  }

  // Get latest metrics for GPU
  async getLatestMetrics(gpuId: string) {
    return prisma.gPUMetrics.findFirst({
      where: { gpuId },
      orderBy: { timestamp: 'desc' },
    });
  }

  // Get metrics history
  async getMetricsHistory(gpuId: string, hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return prisma.gPUMetrics.findMany({
      where: {
        gpuId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  // Get aggregated metrics
  async getAggregatedMetrics(gpuId: string, hours: number = 24) {
    const metrics = await this.getMetricsHistory(gpuId, hours);
    
    if (metrics.length === 0) return null;

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    
    return {
      avgUtilization: avg(metrics.map(m => m.utilization)),
      avgTemperature: avg(metrics.map(m => m.temperature)),
      avgPowerDraw: avg(metrics.map(m => m.powerDraw)),
      maxUtilization: Math.max(...metrics.map(m => m.utilization)),
      maxTemperature: Math.max(...metrics.map(m => m.temperature)),
      dataPoints: metrics.length,
    };
  }

  // Check for alerts
  async checkAlerts(gpuId: string) {
    const latest = await this.getLatestMetrics(gpuId);
    if (!latest) return [];

    const alerts = [];

    if (latest.temperature > 85) {
      alerts.push({ type: 'HIGH_TEMPERATURE', value: latest.temperature });
    }

    if (latest.utilization < 10) {
      alerts.push({ type: 'LOW_UTILIZATION', value: latest.utilization });
    }

    if (latest.memoryUsed / latest.memoryTotal > 0.95) {
      alerts.push({ type: 'HIGH_MEMORY', value: (latest.memoryUsed / latest.memoryTotal) * 100 });
    }

    return alerts;
  }
}

export const metricsService = new MetricsService();
