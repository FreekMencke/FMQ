const argv = require('minimist')(process.argv.slice(2));
const esbuild = require('esbuild');

/** @type esbuild.BuildOptions */
const devConfig = {
  sourcemap: 'linked',
};

/** @type esbuild.BuildOptions */
const prodConfig = {
  minify: true,
};

/** @type esbuild.BuildOptions */
const config = {
  entryPoints: ['src/main.ts'],
  outfile: `dist/${process.env.npm_package_name}.js`,
  bundle: true,
  platform: 'node',
  logLevel: 'info',

  define: {
    VERSION: 'process.env.npm_package_version',
    DEVELOP: !!argv.dev,
  },

  watch: argv.watch,

  metafile: argv.meta,
  ...(argv.dev ? devConfig : prodConfig),
};

if (argv.run) config.plugins = [require('@es-exec/esbuild-plugin-start').default({ script: `node dist/${process.env.npm_package_name}.js` })];

esbuild
  .build(config)
  .then(file => {
    if (argv.meta) require('fs').writeFileSync('dist/meta.json', JSON.stringify(file.metafile));
  });
