// PM2 Ecosystem Configuration
// This file configures how PM2 manages your Timeline app

module.exports = {
  apps: [
    {
      name: 'timeline-api',
      script: './server.js',
      cwd: '/var/www/timeline/backend',
      instances: 2, // Run 2 instances for load balancing (adjust based on CPU cores)
      exec_mode: 'cluster', // Use cluster mode for better performance
      watch: false, // Don't watch files in production
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/www/timeline/logs/error.log',
      out_file: '/var/www/timeline/logs/out.log',
      log_file: '/var/www/timeline/logs/combined.log',
      time: true, // Prefix logs with timestamp
      merge_logs: true,
      
      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    }
  ],

  // Deployment configuration (optional - for PM2 deploy)
  deploy: {
    production: {
      user: 'your_username',
      host: 'your_server_ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/your-repo.git',
      path: '/var/www/timeline',
      'post-deploy': 'cd backend && npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
