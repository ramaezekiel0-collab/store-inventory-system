const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = Number(process.env.PORT || 3000);
const version = process.env.APP_VERSION || 'dev';

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'frontend', version });
});

app.get('/', (_req, res) => {
  const template = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  const html = template.replace('__APP_VERSION__', version);
  res.send(html);
});

app.use(express.static(path.join(__dirname, 'public')));

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Frontend running on port ${port}`);
  });
}

module.exports = { app, version };
