export default (config) => {
  // Important: always return the modified config
  return {
    ...config,
    esbuild: {
      ...config.esbuild,
      loader: 'jsx',
      include: [
        /src\/admin\/.*\.jsx$/,
        /src\/admin\/.*\.js$/,
      ],
    },
    optimizeDeps: {
      ...config.optimizeDeps,
      esbuildOptions: {
        ...config.optimizeDeps?.esbuildOptions,
        loader: {
          '.js': 'jsx',
          '.jsx': 'jsx',
        },
      },
    },
    resolve: {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        '@': '/src',
      },
    },
  };
}; 