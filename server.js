const express = require('express');
const fetch = require('node-fetch'); // v2
const path = require('path');
const { URL } = require('url');

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

    // Remove <base> tags (can break relative links)
    body = body.replace(/<base [^>]+>/g, '');

    // Rewrite all href/src URLs to go through proxy
    body = body.replace(
      /(href|src)=['"]([^'"]+)['"]/g,
      (match, attr, link) => {
        try {
          // Convert relative URLs to absolute using the target URL
          const absoluteUrl = new URL(link, targetUrl).href;
          return `${attr}="/proxy?url=${absoluteUrl}"`;
        } catch {
          return match; // leave it if URL parsing fails
        }
      }
    );

    res.send(body);
  } catch (err) {
    res.status(500).send('Error fetching the site: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
