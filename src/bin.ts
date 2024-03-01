#!/usr/bin/env node
import {Cli} from './cli/index.js';

const cliApp = new Cli().getApp();
cliApp.parse(process.argv);
