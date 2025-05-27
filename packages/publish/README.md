# mosaic-publish

A CLI tool and API for compiling and optimizing specifications. The tool processes spec files, handles dataset optimizations, and provides a configurable way to manage different compile and optimization tasks.

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
  specContent: fs.readFileSync('./path/to/spec.yaml', 'utf8'),
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