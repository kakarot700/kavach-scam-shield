// Scores messages (JSON array on stdin) with the browser feature code and prints the scores.
const fs = require('fs'), path = require('path');
const F = require('../feat.js');
const M = F.loadModel(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'model.json'), 'utf8')));
const msgs = JSON.parse(fs.readFileSync(0, 'utf8'));
console.log(JSON.stringify(msgs.map(t => F.score(M, t))));
