/* eslint-disable */
const yaml = require('yaml');
const path = require('path');
const fs = require('fs');

const configFile = fs.readFileSync(
  path.join(__dirname, './config.yml'),
  'utf-8',
);
const config = yaml.parse(configFile);
fs.writeFileSync(path.join(__dirname, './config.json'), JSON.stringify(config));
