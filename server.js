const express = require('express');
const rs = require('randomstring');
const fs = require('fs');
const app = express();

const html = fs.readFileSync('./index.html');
const sw = fs.readFileSync('./sw.js', 'utf8');

app.get('/', function (req, res) {
  res.set('Content-Type', 'text/html');
  res.send(html);
});

app.get('/sw.js', function (req, res) {
  res.set('Content-Type', 'text/javascript');
  res.send(sw.replace('%VERSION%', rs.generate(5)));
});

app.get('/asset.js', function (req, res) {
  res.set('Content-Type', 'text/javascript');
  res.send(`console.log('${rs.generate(10)}')`);
});

app.listen(3000);