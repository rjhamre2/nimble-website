const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Only proxy API routes - exclude frontend routes like /accept-invite/*
  // This ensures React Router can handle all frontend routes
  if (process.env.REACT_APP_DB_SERVER_URL) {
    app.use(
      '/api',
      createProxyMiddleware({
        target: process.env.REACT_APP_DB_SERVER_URL,
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api',
        },
      })
    );
  }
};

