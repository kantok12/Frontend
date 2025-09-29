module.exports = {
  devServer: {
    allowedHosts: 'all',
    host: 'localhost',
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    client: {
      webSocketURL: 'ws://localhost:3001/ws',
    },
  },
};
