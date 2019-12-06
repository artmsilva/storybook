import path from 'path';
import { Configuration } from 'webpack';
import { logger } from '@storybook/node-logger';
import { applyCRAWebpackConfig, getReactScriptsPath, isReactScriptsInstalled } from './cra-config';

type Preset = string | { name: string };

// Disable the built-in preset if the new preset is detected.
const checkForNewPreset = (presets: Preset[]) => {
  try {
    const hasNewPreset = presets.some((preset: Preset) => {
      const presetName = typeof preset === 'string' ? preset : preset.name;
      return presetName === '@storybook/preset-create-react-app';
    });

    return hasNewPreset;
  } catch (e) {
    logger.warn('Storybook support for Create React App is now a separate preset.');
    logger.warn(
      'To get started with the new preset, simply add `@storybook/preset-create-react-app` to your project.'
    );
    logger.warn('The built-in preset will be disabled in Storybook 6.0.');
    return false;
  }
};

export function webpackFinal(
  config: Configuration,
  { presets, configDir }: { presets: Preset[]; configDir: string }
) {
  if (checkForNewPreset(presets)) {
    return config;
  }
  if (!isReactScriptsInstalled()) {
    logger.info('=> Using base config because react-scripts is not installed.');
    return config;
  }

  logger.info('=> Loading create-react-app config.');
  return applyCRAWebpackConfig(config, configDir);
}

export function managerWebpack(config: Configuration, { presets }: { presets: Preset[] }) {
  if (!isReactScriptsInstalled() || checkForNewPreset(presets)) {
    return config;
  }

  return {
    ...config,
    resolveLoader: {
      modules: ['node_modules', path.join(getReactScriptsPath(), 'node_modules')],
    },
  };
}

export function babelDefault(config: Configuration, { presets }: { presets: Preset[] }) {
  if (!isReactScriptsInstalled() || checkForNewPreset(presets)) {
    return config;
  }

  return {
    ...config,
    presets: [require.resolve('babel-preset-react-app')],
    plugins: [
      [
        require.resolve('babel-plugin-named-asset-import'),
        {
          loaderMap: {
            svg: {
              ReactComponent: '@svgr/webpack?-prettier,-svgo![path]',
            },
          },
        },
      ],
    ],
  };
}
