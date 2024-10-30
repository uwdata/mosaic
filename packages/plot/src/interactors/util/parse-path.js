const paramCounts = { m:2, l:2, h:1, v:1, z:0, c:6, s:4, q:4, t:2, a:7 };
const commandPattern = /[mlhvzcsqta]([^mlhvzcsqta]+|$)/gi;
const numberPattern = /^[+-]?(([0-9]*\.[0-9]+)|([0-9]+\.)|([0-9]+))([eE][+-]?[0-9]+)?/;
const spacePattern = /^((\s+,?\s*)|(,\s*))/;
const flagPattern = /^[01]/;

const errmsg = attr => `Invalid SVG path, incorrect parameter ${attr}`;

/**
 * Parse an SVG path into a list of drawing commands.
 * @param {string} path The SVG path string to parse
 * @returns {[string, ...number][]} A list of drawing commands.
 *  Each command has a single letter as the first entry. All subsequent
 *  entries are numeric parameter values.
 */
export function parsePath(path) {
  const commands = [];
  const matches = path.match(commandPattern) || [];

  matches.forEach(str => {
    let cmd = str[0];
    const type = cmd.toLowerCase();

    // parse parameters
    const paramCount = paramCounts[type];
    const params = parseParams(type, paramCount, str.slice(1).trim());
    const count = params.length;

    // error checking based on parameter count
    if (count < paramCount || (count && count % paramCount !== 0)) {
      throw new Error(errmsg('count'));
    }

    // register the command
    commands.push([cmd, ...params.slice(0, paramCount)]);

    // exit now if we're done, also handles zero-param 'z'
    if (count === paramCount) {
      return;
    }

    // handle implicit line-to
    if (type === 'm') {
      cmd = (cmd === 'M') ? 'L' : 'l';
    }

    // repeat command when given extended param list
    for (let i = paramCount; i < count; i += paramCount) {
      commands.push([cmd, ...params.slice(i, i + paramCount)]);
    }
  });

  return commands;
}

function parseParams(type, paramCount, segment) {
  const params = [];

  for (let index = 0; paramCount && index < segment.length; ) {
    for (let i = 0; i < paramCount; ++i) {
      const pattern = type === 'a' && (i === 3 || i === 4) ? flagPattern : numberPattern;
      const match = segment.slice(index).match(pattern);

      if (match === null) {
        throw new Error(errmsg('type'));
      }

      index += match[0].length;
      params.push(+match[0]);

      const ws = segment.slice(index).match(spacePattern);
      if (ws !== null) {
        index += ws[0].length;
      }
    }
  }

  return params;
}
