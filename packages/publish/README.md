# mosaic-publish

A CLI tool for compiling and optimizing specifications. The tool processes spec files, handles dataset optimizations, and provides a configurable way to manage different compile and optimization tasks.

## Installation

This tool is designed to be used via `npx` or can be installed globally.

### Run with `npx`

```bash
npx @uwdata/publish --spec ./path/to/spec.json
```

### Global Installation

To install the CLI tool globally:

```bash
npm install -g @uwdata/publish
```

Now you can run the tool from anywhere:

```bash
mosaic-publish --spec ./path/to/spec.json
```