/* eslint-disable */
const yaml = require('yaml');
const path = require('path');
const fs = require('fs');

const configFile = fs.readFileSync(
  path.join(__dirname, './config.yml'),
  'utf-8',
);
const config = yaml.parse(configFile);

function flatten(obj, command, newObj) {
  if (obj['_leaf']) {
    newObj[command] = obj['_leaf'];

    if (!newObj[command].type) {
      let autoinfer;
      if ('q_params' in newObj[command]) {
        autoinfer = 'querystring';
      } else {
        autoinfer = 'redirect';
      }
      console.warn(`Missing type in ${command}, bunny infers '${autoinfer}'.`);
      newObj[command].type = autoinfer;
    }

    if (!newObj[command].base_url) {
      throw new Error(
        `Missing base url in ${command}. Check your config.yml again`,
      );
    }

    // transform q_params to an array with 1 element if it is a string
    if (
      'q_params' in newObj[command] &&
      typeof newObj[command]['q_params'] === 'string'
    ) {
      newObj[command]['q_params'] = [newObj[command]['q_params']];
    }

    return;
  }

  if (obj['_default']) {
    newObj[command] = {
      base_url: obj['_default'],
      type: 'redirect',
    };
  }

  for (let [key, value] of Object.entries(obj)) {
    if (key[0] !== '_') {
      flatten(value, `${command} ${key}`.trim(), newObj);
    }
  }
}

// flatten the tree
const flattenedConfig = {};
flatten(config, '', flattenedConfig);

fs.writeFileSync(
  path.join(__dirname, './config.json'),
  JSON.stringify(flattenedConfig),
);
