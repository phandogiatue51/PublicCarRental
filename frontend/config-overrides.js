const path = require('path');

module.exports = function override(config) {
  config.resolve.alias = {
    ...config.resolve.alias,
    '@admin': path.resolve(__dirname, 'src/admin'),
    '@components': path.resolve(__dirname, 'src/admin/components'),
    '@assets': path.resolve(__dirname, 'src/admin/assets'),
    '@views': path.resolve(__dirname, 'src/admin/views'),
    '@contexts': path.resolve(__dirname, 'src/admin/contexts'),
    '@layout': path.resolve(__dirname, 'src/admin/layout'),
    '@theme': path.resolve(__dirname, 'src/admin/theme'),
    '@hooks': path.resolve(__dirname, 'src/admin/hooks'),
    '@services': path.resolve(__dirname, 'src/admin/services'),
    '@utils': path.resolve(__dirname, 'src/admin/utils'),
  };
  return config;
};
