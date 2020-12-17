/* eslint-disable */

/**
 * This file is the "build script" for the project.
 * 1. Read the yaml configuration as a JSON file and sort based on the key. This is to have an ordered command list page
 * 2. Flatten the JSON file to depth 1, each command maps to the configuration
 * 3. Write the json file to src/ folder so that webpack can take care of it.
 * 4. Use the flattened file to pass the docstrings into cmdlist.ejs
 */
const yaml = require('yaml');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const project = require('../package.json');

const DEFAULT_CONFIG_KEY = '$default$';
const inYmlFilePath = './config.yml';
const outJsonFilePath = '../src/config.json';
const outHtmlFilePath = '../src/cmdlist.html';

const configFile = fs.readFileSync(
  path.join(__dirname, inYmlFilePath),
  'utf-8',
);
let config = yaml.parse(configFile);

// modified from https://stackoverflow.com/questions/5467129/sort-javascript-object-by-key
config = Object.keys(config)
  .sort()
  .reduce((obj, key) => ({ ...obj, [key]: config[key] }), {});

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
 * Functions to augment query config obj
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

/**
 * Functions to augment path config obj
 */
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

// flatten the tree and write to json file
const flattenedConfig = {};
flatten(config, '', flattenedConfig);

fs.writeFileSync(
  path.join(__dirname, outJsonFilePath),
  JSON.stringify(flattenedConfig),
);

// take compiled tailwind css and plop it into the html file we generate from ejs
let env = process.env.NODE_ENV || 'development';

ejs.renderFile(
  'src/cmdlist.ejs',
  {
    config: flattenedConfig,
    css: fs.readFileSync(path.join(__dirname, `../dist/tailwind.${env}.css`), {
      encoding: 'utf-8',
    }),
    DEFAULT_CONFIG_KEY,
    project,
  },
  { root: './src' },
  function(err, html) {
    if (err) {
      console.error(err);
      return;
    }

    fs.writeFileSync(path.join(__dirname, outHtmlFilePath), html);
  },
);
