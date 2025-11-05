module.exports = {
  apps: [{
    name: 'emerald-erp',
    script: './dist/index.js',
    instances: 'max', // Использовать все доступные ядра CPU
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/emerald-erp-error.log',
    out_file: '/var/log/pm2/emerald-erp-out.log',
    log_file: '/var/log/pm2/emerald-erp-combined.log',
    time: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    cron_restart: '0 2 * * *', // Перезапуск каждый день в 2 ночи
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};