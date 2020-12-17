/* eslint-disable */
const yaml = require('yaml');
const path = require('path');
const fs = require('fs');

const configFile = fs.readFileSync(
  path.join(__dirname, '../config.yml'),
  'utf-8',
);
const config = yaml.parse(configFile);

function flatten(obj, command, newObj) {
  for (let [key, value] of Object.entries(obj)) {
    if (key === '_leaf') {
      newObj[command] = obj['_leaf'];

      if (!newObj[command].type) {
        let autoinfer;
        if ('q_params' in newObj[command]) {
          autoinfer = 'querystring';
        } else {
          autoinfer = 'redirect';
        }
        console.info(
          `[Info] Missing type in ${command}, bunny infers '${autoinfer}'.`,
        );
        newObj[command].type = autoinfer;
      }

      if (!newObj[command].base_url) {
        throw new Error(
          `Missing base url in ${command}. Check your config.yml again`,
        );
      }

      _treatQueryBased(newObj[command]);
      _treatPathBased(newObj[command]);
    } else {
      flatten(value, `${command} ${key}`.trim(), newObj);
    }
  }
}

/**
 * Functions to augment default object
 */

function _treatQueryBased(obj = {}) {
  if (obj.type !== 'querystring') {
    return;
  }
  // transform q_params to an array with 1 element if it is a string
  if ('q_params' in obj && typeof obj['q_params'] === 'string') {
    obj['q_params'] = [obj['q_params']];
  }
}

function _treatPathBased(obj = {}) {
  if (obj.type !== 'path') {
    return;
  }

  // match {{ keyword }}
  let regexp = /{{\s*(.*?)\s*}}/g;
  keywords = [...obj.base_url.matchAll(regexp)].map(x => x[1]);
  options = {};

  // sanity check that all keyword has known options, then move it to options.
  for (let keyword of keywords) {
    if (!(keyword in obj)) {
      console.warn(
        `[Warn] You have not specified options for ${keyword} in ${obj.base_url}`,
      );
      continue;
    }

    options[keyword] = obj[keyword];
    delete obj[keyword];
  }

  // assign options back to obj
  obj.keywords = keywords;
  obj.options = options;
}

// flatten the tree
const flattenedConfig = {};
flatten(config, '', flattenedConfig);

fs.writeFileSync(
  path.join(__dirname, './config.json'),
  JSON.stringify(flattenedConfig),
);
