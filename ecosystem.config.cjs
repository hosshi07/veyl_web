module.exports = {
  apps: [
    {
      name: "veyl-web",
      script:
        process.env.VEYL_SERVER_PATH || "./node_modules/next/dist/bin/next",
      args: process.env.VEYL_SERVER_PATH
        ? []
        : [
            "start",
            "--hostname",
            "0.0.0.0",
            "--port",
            process.env.PORT || "3000",
          ],
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      kill_timeout: 10000,
      exp_backoff_restart_delay: 100,
      time: true,
      env: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
        PORT: process.env.PORT || "3000",
      },
    },
  ],
};
