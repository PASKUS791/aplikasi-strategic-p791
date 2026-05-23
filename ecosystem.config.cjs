/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 *
 * PM2 config untuk backend Strategic P791.
 */

module.exports = {
  apps: [
    {
      name: "strategic-p791",
      cwd: "/var/www/strategic-p791",
      script: "strategic-api-backend/index.js",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        API_PORT: 8787,
      },
    },
  ],
};
