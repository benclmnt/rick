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
const projectInfo = require('../package.json');

const BASE_URL = 'https://rick.benclmnt.com';
const DEFAULT_CONFIG_KEY = '$default$';
const inYmlFilePath = '../rick.config.yml';
const outJsonFilePath = '../src/config.json';
const outHtmlFilePath = '../src/resources/cmdlist.html';

const configFile = fs.readFileSync(
  path.join(__dirname, inYmlFilePath),
  'utf-8',
);
let config;
try {
  config = yaml.parse(configFile);
} catch (e) {
  console.error(e);
  process.exit(1);
}

/**
 * @typedef BaseFlatConfig
 * @type {{ base_url: string, type: string, docstring: ?string }}
 *
 * @typedef QueryFlatConfig
 * @type {{ base_url: string, type: string, docstring: ?string, q_params: string[] }}
 *
 * @typedef PathOptions
 * @type {{ Object.<string, Object.<string, string>> }}
 *
 * @typedef PathFlatConfig
 * @type {{ base_url: string, type: string, docstring: ?string, keywords: string[], options: PathOptions }}
 */

/**
 * A recursive function to generate `config.json`
 *
 * @param {string} command
 * @param {Object} obj
 * @param {Object.<string, (BaseFlatConfig|QueryFlatConfig|PathFlatConfig)>} newObj
 */
function flatten(obj, command, newObj) {
  for (let [key, value] of Object.entries(obj)) {
    if (typeof value !== 'object') {
      /*
      we hit the leaf and do not find 'base_url' property
      means this is using the <string,string> shortcut for an equivalent, i.e.
      `a: https://www.example.com`
      vs
      `
      a:
        base_url: https://www.example.com
      `
      */
      value = {
        base_url: value,
      };
    }

    let cmd = `${command} ${key === '_leaf' ? '' : key}`.trim();
    if (value['base_url']) {
      newObj[cmd] = value;

      if (!newObj[cmd].type) {
        let autoinfer;
        if ('q_params' in newObj[cmd]) {
          autoinfer = 'querystring';
        } else if (value['base_url'].includes('{{')) {
          autoinfer = 'path';
        } else {
          autoinfer = 'redirect';
        }
        console.info(
          `[Info] Missing type in ${cmd}, rick infers '${autoinfer}'.`,
        );
        newObj[cmd].type = autoinfer;
      }

      _treatQueryBased(newObj[cmd]);
      _treatPathBased(newObj[cmd]);
    } else {
      flatten(value, cmd, newObj);
    }
  }
}

/**
 * Functions to augment query config obj
 * @param {BaseFlatConfig} obj
 */
function _treatQueryBased(obj) {
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
 *  @param {BaseFlatConfig} obj
 */
function _treatPathBased(obj) {
  if (obj.type !== 'path') {
    return;
  }

  // match {{ keyword }}
  let regexp = /{{\s*(.*?)\s*}}/g;
  let keywords = [...obj.base_url.matchAll(regexp)].map(x => x[1]);
  let options = {};

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
  let pathObj = /** @type {PathFlatConfig} */ (obj);
  pathObj.keywords = keywords;
  pathObj.options = options;
}

// flatten the tree and write to json file
/** @type {Object.<string, (BaseFlatConfig|QueryFlatConfig|PathFlatConfig)>} */
let flattenedConfig = {};
flatten(config, '', flattenedConfig);

// modified from https://stackoverflow.com/questions/5467129/sort-javascript-object-by-key
flattenedConfig = Object.keys(flattenedConfig)
  .sort()
  .reduce((obj, key) => ({ ...obj, [key]: flattenedConfig[key] }), {});

fs.writeFileSync(
  path.join(__dirname, outJsonFilePath),
  JSON.stringify(flattenedConfig),
);

// take compiled tailwind css and plop it into the html file we generate from ejs
let env = process.env.NODE_ENV || 'development';

ejs.renderFile(
  'src/resources/cmdlist.ejs',
  {
    BASE_URL,
    config: flattenedConfig,
    css: fs.readFileSync(path.join(__dirname, `../dist/tailwind.${env}.css`), {
      encoding: 'utf-8',
    }),
    DEFAULT_CONFIG_KEY,
    title: projectInfo.name,
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
