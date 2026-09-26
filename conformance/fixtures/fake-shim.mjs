// Stands in for packages/vgplot/widget/conformance/shim.py in harness tests.
// The request's `sql` is a script of what to do, so a test controls replies,
// their order, and misbehaviour without a Python process:
//   ok            reply {type: arrow, uuid} with one buffer, then done
//   twice         reply twice, then done
//   silent        done with no reply
//   raise         done with raised, no reply
//   reply-raise   reply, then done with raised
//   wrong-uuid    reply echoing "someone-else"
//   missing-uuid  reply with no uuid
//   error-string  legacy {error: "boom", uuid}
//   error         {type: error, uuid, error: {...}} for a missing field
//   exit          exit before done
//   garbage       write a non-JSON line
//   defer:<ms>    hold the reply until after <ms> (lets a later message be answered first)
//   hang          never answer
import { createInterface } from 'node:readline';

const stream = Buffer.from('ARROW-STREAM-PLACEHOLDER').toString('base64');
const emit = record => process.stdout.write(`${JSON.stringify(record)}\n`);
const reply = (id, content, buffers = []) => emit({ id, kind: 'reply', content, buffers });
const done = (id, raised = null) => emit({ id, kind: 'done', raised });

createInterface({ input: process.stdin }).on('line', line => {
  if (!line.trim()) return;
  const { id, content } = JSON.parse(line);
  const uuid = content.uuid;
  const [action, arg] = String(content.sql ?? 'ok').split(':');
  const answer = () => {
    switch (action) {
      case 'ok': reply(id, { type: 'arrow', uuid }, [stream]); done(id); break;
      case 'twice': reply(id, { type: 'arrow', uuid }, [stream]); reply(id, { type: 'arrow', uuid }, [stream]); done(id); break;
      case 'silent': done(id); break;
      case 'raise': done(id, "KeyError: 'uuid'"); break;
      case 'reply-raise': reply(id, { type: 'exec', uuid }); done(id, 'RuntimeError: after send'); break;
      case 'wrong-uuid': reply(id, { type: 'exec', uuid: 'someone-else' }); done(id); break;
      case 'missing-uuid': reply(id, { type: 'exec' }); done(id); break;
      case 'error-string': reply(id, { error: 'boom', uuid }); done(id); break;
      case 'error': reply(id, { type: 'error', uuid: uuid ?? null, error: { error: 'missing sql', code: 'bad_request', reason: 'missing_field', field: 'sql' } }); done(id); break;
      case 'exit': process.exit(3); break;
      case 'garbage': process.stdout.write('not json\n'); break;
      case 'hang': break;
      default: reply(id, { type: 'arrow', uuid }, [stream]); done(id);
    }
  };
  if (action === 'defer') setTimeout(() => { reply(id, { type: 'arrow', uuid }, [stream]); done(id); }, Number(arg));
  else answer();
});
