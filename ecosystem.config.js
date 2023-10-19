/**
 * @description pm2 configuration file.
 * @example
 *  production mode :: pm2 start ecosystem.config.js --only prod
 *  development mode :: pm2 start ecosystem.config.js --only dev
 */

module.exports = {
    apps: [
      {
        name: 'prod',
        script: './index.js',
        exec_mode: 'cluster',
        instance_var: 'INSTANCE_ID',
        instances: 2,
        autorestart: true,
        watch: false,
        ignore_watch: ['node_modules', 'logs'],
        max_memory_restart: '1G',
        merge_logs: true,
        output: './logs/access.log',
        error: './logs/error.log',
        env: {
          PORT: 10003,
          NODE_ENV: 'prod',
        },
      },
      {
        name: 'dev',
        script: './index.js',
        exec_mode: 'fork',
        autorestart: true,
        watch: true,
        ignore_watch: ['node_modules', 'logs'],
        max_memory_restart: '1G',
        merge_logs: true,
        output: './logs/access.log',
        error: './logs/error.log',
        env: {
          PORT: 10003,
          NODE_ENV: 'dev',
        },
      },
    ]
  }
  