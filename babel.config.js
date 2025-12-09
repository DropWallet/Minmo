module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      [
        require('babel-plugin-module-resolver'),
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@utils': './src/utils',
            '@store': './src/store',
            '@db': './src/db',
            '@api': './src/api',
            '@config': './src/config',
            '@hooks': './src/hooks',
          },
        },
      ],
      require('react-native-reanimated/plugin'), // Must be last
    ],
  };
};

