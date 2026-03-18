const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix: Zustand 5.x ESM build uses import.meta.env which causes SyntaxError
// in regular <script> tags on web. Force zustand to resolve to CJS builds.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName.startsWith('zustand')) {
    const parts = moduleName.split('/');
    const cjsPath = path.resolve(__dirname, 'node_modules', ...parts) + '.js';
    try {
      require.resolve(cjsPath);
      return { filePath: cjsPath, type: 'sourceFile' };
    } catch (e) {
      // Fall through to default resolution
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
