/*
 * Copyright 2025 SpinalCom - www.spinalcom.com
 * 
 * This file is part of SpinalCore.
 * 
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 * 
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 * 
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */

// http-silent-logger.js
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'http-requests.log');

function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;

  fs.appendFileSync(logFile, logEntry); // Synchrone pour simplicité
}

// Message de démarrage
logToFile('=== HTTP Logger started ===');

['http', 'https'].forEach(protocol => {
  const module = require(protocol);
  const originalRequest = module.request;

  module.request = function (options, callback) {
    let url, method;

    if (typeof options === 'string') {
      url = options;
      method = 'GET';
    } else {
      url = `${protocol}://${options.hostname || options.host}${options.port ? ':' + options.port : ''}${options.path || '/'}`;
      method = (options.method || 'GET').toUpperCase();
    }

    logToFile(`${method} ${url}`);

    return originalRequest.apply(this, arguments);
  };
});