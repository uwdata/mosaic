#!/usr/bin/env node

import { MosaicPublisher, PublishError } from './MosaicPublisher.js';
import { LogLevel, toLogLevel, Logger } from './util/index.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import fs from 'fs';

// Build the command-line parser without using the yargs type parameter:
const parsed = yargs(hideBin(process.argv))
  .scriptName('mosaic-publish')
  .usage('$0 [args]')
  .options({
    spec: {
      alias: 's',
      type: 'string',
      describe: 'Path to the specification file',
      demandOption: true,
    },
    optimize: {
      alias: 'o',
      type: 'string',
      describe: 'Level of optimizations',
      choices: ['none', 'minimal', 'more', 'most'] as const,
      default: 'minimal',
    },
    output: {
      alias: 'out',
      type: 'string',
      describe: 'Output folder path for the result',
    },
    title: {
      alias: 't',
      type: 'string',
      describe: 'Title of published visualization',
    },
    logLevel: {
      alias: 'l',
      type: 'string',
      describe: 'Logging level',
      choices: Object.values(LogLevel)
        .filter((key) => typeof key === 'string')
        .map((key) => key.toLowerCase()),
      default: 'info'
    }
  })
  .help()
  .parseSync();

const argv = {
  spec: parsed.spec as string,
  optimize: parsed.optimize as 'none' | 'minimal' | 'more' | 'most',
  output: parsed.output as string | undefined,
  title: parsed.title as string | undefined,
};
const logger = new Logger(toLogLevel(parsed.logLevel));

// Pretty-print the publishing configuration
logger.info(chalk.dim('================================'))
logger.info(chalk.bold(chalk.yellow('Publishing Configuration')));
logger.info(chalk.blue('Spec Path:'), argv.spec);
logger.info(chalk.blue('Optimization Level:'), argv.optimize);
if (argv.output) {
  logger.info(chalk.blue('Output Path:'), argv.output);
}
if (argv.title) {
  logger.info(chalk.bold('Visualization Title:'), argv.title);
}
logger.info(chalk.dim('================================'))

let spec: string;
try {
  spec = fs.readFileSync(argv.spec, 'utf-8');
  logger.info(chalk.greenBright('Specification file successfully read.'));
} catch (err) {
  logger.error('Failed to read the spec file:\n', err);
  process.exit(1);
}

// Instantiate the publisher
const publisher = new MosaicPublisher(
  spec,
  argv.output,
  argv.title,
  argv.optimize,
  logger
);

// Execute publishing in an async context
(async () => {
  try {
    await publisher.publish();
    logger.info(chalk.greenBright('✔ Publishing complete! ✔'));
  } catch (err) {
    if (err instanceof PublishError) {
      logger.error('An error occurred while publishing:\n', err);
    } else {
      logger.error('An unexpected error occurred:\n', err);
    }
    process.exit(1);
  }
})();