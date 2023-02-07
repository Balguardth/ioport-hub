#!/usr/bin/env node
var extract = require('extract-zip');

var args = process.argv.splice(2);
var source = args[0];
var dest = args[1];

if (!source) {

  console.error('Usage: extract-zip foo.zip <targetDirectory>');
  process.exit(1);

}

extract(source, { dir: dest }).catch(function (err) {

    console.error('error!', err);
    process.exit(1);

  });