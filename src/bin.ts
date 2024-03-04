#!/usr/bin/env node
import {getApp} from './cli/index.js';

const cliApp = getApp();
cliApp.parse(process.argv);
