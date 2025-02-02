#!/usr/bin/env node

import { MosaicPublisher } from './MosaicPublisher.js';
import { LogLevel } from './util/index.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';

interface CliArgs {
  spec: string;
  optimize: 'minimal' | 'more' | 'most';
  output?: string;
  title?: string;
  logLevel: LogLevel;
}

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
      choices: ['minimal', 'more', 'most'] as const,
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
      describe: 'Logging level (debug, info, warn, error, silent)',
      choices: ['debug', 'info', 'warn', 'error', 'silent'] as const,
      default: 'info'
    }
  })
  .help()
  .parseSync();

// Cast the results to our interface
const argv: CliArgs = {
  spec: parsed.spec,
  optimize: parsed.optimize as 'minimal' | 'more' | 'most',
  output: parsed.output,
  title: parsed.title,
  logLevel: parsed.logLevel as LogLevel
};

// Provide user-facing pretty-print statements
console.log(chalk.bold.blue('Spec file:'), chalk.yellowBright(argv.spec));
console.log(chalk.bold.blue('Optimize:'), chalk.yellowBright(argv.optimize));
console.log(chalk.bold.blue('Output:'), chalk.yellowBright(argv.output ?? 'out/'));
if (argv.title) {
  console.log(chalk.bold.blue('Title:'), chalk.yellowBright(argv.title));
}

// Instantiate the publisher
const publisher = new MosaicPublisher(
  argv.spec, 
  argv.output ?? 'out', 
  argv.title, 
  argv.optimize, 
  argv.logLevel
);

// Execute publishing in an async context
(async () => {
  try {
    console.log(chalk.cyan('Publishing visualization...'));
    await publisher.publish();
    console.log(chalk.bold.green('✔ Publish complete!'));
  } catch (err) {
    console.error(chalk.red('An error occurred while publishing:'), err);
    process.exit(1);
  }
})();