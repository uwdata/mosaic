#!/usr/bin/env node

import { MosaicPublisher, PublishError, PublishExitCode } from './MosaicPublisher.js';
import { LogLevel, toLogLevel, Logger } from './util/index.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import fs, { read } from 'fs';

const parsed = yargs(hideBin(process.argv))
  .scriptName('mosaic-publish')
  .usage('$0 <spec> [options]')
  .positional('spec', {
    describe: 'Path to the specification file',
    type: 'string',
    demandOption: true
  })
  .options({
    optimize: {
      alias: 'o',
      type: 'string',
      describe: 'Level of optimizations',
      choices: ['none', 'minimal', 'more', 'most'] as const,
      default: 'more',
      group: 'Optimization Options:',
    },
    output: {
      alias: 'out',
      type: 'string',
      describe: 'Output folder path for the result',
      group: 'Output Options:',
    },
    overwrite: {
      type: 'boolean',
      describe: 'Allow overwriting the output directory if it exists',
      default: false,
      group: 'Output Options:',
    },
    title: {
      alias: 't',
      type: 'string',
      describe: 'Title of published visualization',
      group: 'Output Options:',
    },
    logLevel: {
      alias: 'l',
      type: 'string',
      group: 'Logging:',
      describe: 'Logging level (overridden by --quiet or --verbose)',
      choices: Object.values(LogLevel)
        .filter((key) => typeof key === 'string')
        .map((key) => key.toLowerCase()),
      default: 'info'
    },
    quiet: {
      type: 'boolean',
      describe: 'Suppress all output except errors (sets log level to error)',
      group: 'Logging:',
      conflicts: 'verbose'
    },
    verbose: {
      type: 'boolean',
      describe: 'Enable debug logging (sets log level to debug)',
      group: 'Logging:',
      conflicts: 'quiet'
    }
  })
  .middleware(argv => {
    if (argv.quiet) argv.logLevel = 'error';
    if (argv.verbose) argv.logLevel = 'debug';
  })
  .help()
  .parseSync();

const argv = {
  spec: parsed._[0] as string,
  optimize: parsed.optimize as 'none' | 'minimal' | 'more' | 'most',
  output: parsed.output as string | undefined,
  title: parsed.title as string | undefined,
  overwrite: parsed.overwrite as boolean,
};
const logger = new Logger(toLogLevel(parsed.logLevel));

logger.info(chalk.dim('================================'));
logger.info(chalk.bold(chalk.yellow('Publishing Configuration')));
logger.info(chalk.blue('Spec Path:'), argv.spec);
logger.info(chalk.blue('Optimization Level:'), argv.optimize);
if (argv.output) {
  logger.info(chalk.blue('Output Path:'), argv.output);
}
if (argv.title) {
  logger.info(chalk.bold('Visualization Title:'), argv.title);
}
logger.info(chalk.dim('================================'));

let spec: string;
try {
  spec = fs.readFileSync(argv.spec, 'utf-8');
  logger.info(chalk.greenBright('Specification file successfully read.'));
} catch (err) {
  logger.error(chalk.redBright('Error: ') + 'Failed to read the spec file.');
  logger.error(err instanceof Error ? err.message : String(err));
  process.exit(PublishExitCode.FILE_READ_ERROR);
}

// Instantiate the publisher
const publisher = new MosaicPublisher({
  spec,
  outputPath: argv.output,
  title: argv.title,
  optimize: argv.optimize,
  logger,
  overwrite: argv.overwrite
});

// Execute publishing in an async context
(async () => {
  try {
    await publisher.publish();
    logger.info(chalk.greenBright('✔ Publishing complete! ✔'));
  } catch (err) {
    if (err instanceof PublishError) {
      logger.error(chalk.redBright('Publisher Error: ') + err.message);
      process.exit(err.code ?? PublishExitCode.PUBLISH_ERROR);
    } else {
      logger.error(chalk.redBright('Unknown Error:'));
      logger.error(err instanceof Error ? err.message : String(err));
      process.exit(PublishExitCode.UNKNOWN_ERROR);
    }
  }
})();