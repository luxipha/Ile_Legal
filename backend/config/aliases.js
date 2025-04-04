const path = require('path');
const moduleAlias = require('module-alias');

// Define project root
const rootDir = path.resolve(__dirname, '..');

// Register aliases
moduleAlias.addAliases({
  '@root': rootDir,
  '@models': path.join(rootDir, 'models'),
  '@services': path.join(rootDir, 'services'),
  '@config': path.join(rootDir, 'config'),
  '@routes': path.join(rootDir, 'routes'),
  '@middlewares': path.join(rootDir, 'middlewares'),
  '@node_modules': path.join(rootDir, 'node_modules')
});

console.log('Module aliases registered successfully');