const express = require('express');
const fetch = require('node-fetch'); // v2
const path = require('path');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ------------------ PROXY ROUTE ------------------
app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('No URL specified');

  try {
    const response = await fetch(targetUrl);
    let body = await response.text();

    // Remove <base> tags (breaks relative URLs)
    body = body.replace(/<base [^>]+>/g, '');

    // Rewrite href/src URLs to go through proxy
    body = body.replace(
      /(href|src)=['"]([^'"]+)['"]/g,
      (match, attr, link) => {
        try {
          const absoluteUrl = new URL(link, targetUrl).href;
          return `${attr}="/proxy?url=${absoluteUrl}"`;
        } catch {
          return match;
        }
      }
    );

    res.send(body);
  } catch (err) {
    res.status(500).send('Error fetching the site: ' + err.message);
  }
});

// ------------------ SEARCH ROUTE ------------------
// Fetch top 10 results from DuckDuckGo
app.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).send('No query provided');

  try {
    const response = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
    const html = await response.text();

    const regex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>.*?<a class="result__snippet">([^<]+)<\/a>/gs;
    const results = [];
    let match;
    while ((match = regex.exec(html)) && results.length < 10) {
      results.push({
        title: match[2],
        url: match[1],
        description: match[3]
      });
    }

    res.json(results);
  } catch (err) {
    res.status(500).send('Search error: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
