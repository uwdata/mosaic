# mosaic-publish
> ⚠️ **EXPERIMENTAL PACKAGE** ⚠️ - This package is in a development state and things may change without notice. Use with caution in production environments.

A CLI tool and API for compiling and performing publish time optimizations to Mosaic specifications. The tool processes spec files, incrementally applying data preparation and projection, pre-computation of data assets for optimization, and pre-rendering of visual outputs.

## Package Structure

- **`src/MosaicPublisher.ts`** - Core publisher class that handles spec compilation and optimization
- **`src/cli.ts`** - Command-line interface implementation using yargs
- **`src/util/`** - Utility modules including constants, logging, and helper functions
- **`test/`** - Test files for both API and CLI functionality

## CLI Installation

This tool is designed to be used via `npx` or can be installed globally.

### Run with `npx`

```bash
npx @uwdata/publish ./path/to/spec.yaml -o most
```

### Global Installation

To install the CLI tool globally:

```bash
npm install -g @uwdata/publish
```

Now you can run the tool from anywhere:

```bash
mosaic-publish ./path/to/spec.yaml -o most
```

## API Usage

The functionality of mosaic-publish can also be accessed programmatically via its API. For example:

```js
import { MosaicPublisher } from '@uwdata/publish';
import fs from 'fs';

const publisher = new MosaicPublisher({
  spec: fs.readFileSync('./path/to/spec.yaml', 'utf8'),
  outputPath: './path/to/output/directory'
});

publisher.publish()
  .then(() => {
    console.log('Specification compiled and optimized successfully.');
  })
  .catch(err => {
    console.error('Error during publish:', err);
  });
```