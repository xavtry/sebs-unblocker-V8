const express = require('express');
const fetch = require('node-fetch'); // v2
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve frontend static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Proxy route
app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('No URL specified');

  try {
    const response = await fetch(targetUrl);
    let body = await response.text();

    // Rewrite relative links to go through the proxy
    body = body.replace(
      /(href|src)=['"]((?!http)[^'"]+)['"]/g,
      `$1="/proxy?url=${targetUrl}/$2"`
    );

    res.send(body);
  } catch (err) {
    res.status(500).send('Error fetching the site: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
