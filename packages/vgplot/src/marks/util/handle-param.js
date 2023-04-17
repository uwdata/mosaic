import { isParam } from '@uwdata/mosaic-core';

export function handleParam(client, key, param, update) {
  if (isParam(param)) {
    update = update || (() => client.requestUpdate());
    param.addEventListener('value', value => {
      client[key] = value;
      return update();
    });
    client[key] = param.value;
  } else {
    client[key] = param;
  }
}
