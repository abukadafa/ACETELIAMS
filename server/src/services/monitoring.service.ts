import os from 'os';
import mongoose from 'mongoose';

class MonitoringService {
    async getSystemStatus() {
        const stats: any = {};

        // 1. OS Metrics
        const totalMem = os.totalmem();
        const freeMem = os.totalmem(); // Simplified for now since we just need the system running
        const usedMem = totalMem - os.freemem();
        const memPercent = (usedMem / totalMem) * 100;

        stats.system = {
            platform: os.platform(),
            uptime: os.uptime(),
            cpuCount: os.cpus().length,
            loadAvg: os.loadavg(),
            memory: {
                total: this.formatBytes(totalMem),
                used: this.formatBytes(usedMem),
                free: this.formatBytes(os.freemem()),
                percent: memPercent.toFixed(1)
            }
        };

        // 2. Database Status
        stats.database = {
            status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            name: mongoose.connection.name,
            host: mongoose.connection.host
        };

        // 3. Alerts
        stats.alerts = this.generateAlerts(stats);

        return stats;
    }

    private generateAlerts(stats: any) {
        const alerts = [];

        if (parseFloat(stats.system.memory.percent) > 90) {
            alerts.push({
                severity: 'critical',
                type: 'memory',
                message: `System memory usage is very high: ${stats.system.memory.percent}%`
            });
        }

        if (stats.database.status !== 'connected') {
            alerts.push({
                severity: 'critical',
                type: 'database',
                message: 'Database connection is lost'
            });
        }

        return alerts;
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }
}

export default new MonitoringService();
