#!/usr/bin/env node

var arguments = require('arguments');

var app = require("./app/app").load();
app.start(arguments);
