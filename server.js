const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve frontend files
app.use(express.static('public'));

// Proxy route
app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('No URL specified');

  try {
    const response = await fetch(targetUrl);
    let body = await response.text();

    // Fix relative links to go through the proxy
    body = body.replace(/(href|src)=["'](?!http)([^"']+)["']/g, `$1="/proxy?url=${targetUrl}/$2"`);

    res.send(body);
  } catch (err) {
    res.status(500).send('Error fetching the site: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
