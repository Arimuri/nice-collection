import fs from "fs";
import path from "path";

const DIST = "./dist";
const FILES = ["nice-movie.md", "nice-music.md", "nice-book.md"];
const LABELS = {
  "nice-movie.md": { title: "🎬 Nice Movies", emoji: "🎬" },
  "nice-music.md": { title: "🎵 Nice Music", emoji: "🎵" },
  "nice-book.md": { title: "📚 Nice Books", emoji: "📚" },
};

fs.mkdirSync(DIST, { recursive: true });

function extractYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function extractSpotifyId(url) {
  const match = url.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
  return match ? { type: match[1], id: match[2] } : null;
}

function urlToEmbed(url) {
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return `<div class="embed"><iframe src="https://www.youtube.com/embed/${ytId}" frameborder="0" allowfullscreen></iframe></div>`;
  }

  const spotify = extractSpotifyId(url);
  if (spotify) {
    return `<div class="embed spotify"><iframe src="https://open.spotify.com/embed/${spotify.type}/${spotify.id}" frameborder="0" allow="encrypted-media"></iframe></div>`;
  }

  // Generic link card
  return `<a href="${url}" class="link-card" target="_blank">${url}</a>`;
}

function mdToHtml(content) {
  const lines = content.split("\n");
  let html = "";

  for (const line of lines) {
    if (line.startsWith("# ")) {
      // Skip top heading (we use our own)
      continue;
    } else if (line.startsWith("### ")) {
      html += `<h3>${line.replace("### ", "")}</h3>\n`;
    } else if (line.startsWith("🔗 ")) {
      const url = line.replace("🔗 ", "").trim();
      html += urlToEmbed(url) + "\n";
    } else if (line.startsWith("> ")) {
      html += `<blockquote>${line.replace("> ", "")}</blockquote>\n`;
    } else if (line.startsWith("*") && line.endsWith("*")) {
      html += `<p class="date">${line.replace(/\*/g, "")}</p>\n`;
    } else if (line.trim() === "---") {
      // skip
    } else if (line.trim()) {
      html += `<p>${line}</p>\n`;
    }
  }

  return html;
}

function buildPage(file) {
  const info = LABELS[file];
  let content = "";
  if (fs.existsSync(file)) {
    content = fs.readFileSync(file, "utf-8");
  }

  const entries = mdToHtml(content);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${info.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0d1117;
      color: #e6edf3;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    nav {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #30363d;
    }
    nav a {
      color: #58a6ff;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      transition: background 0.2s;
    }
    nav a:hover, nav a.active {
      background: #21262d;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 2rem;
    }
    h3 {
      font-size: 1.2rem;
      margin-top: 2rem;
      margin-bottom: 0.5rem;
      color: #f0f6fc;
    }
    .embed {
      margin: 0.5rem 0;
      border-radius: 8px;
      overflow: hidden;
    }
    .embed iframe {
      width: 100%;
      aspect-ratio: 16/9;
      border: none;
    }
    .embed.spotify iframe {
      height: 80px;
      aspect-ratio: auto;
    }
    blockquote {
      border-left: 3px solid #58a6ff;
      padding: 0.5rem 1rem;
      margin: 0.5rem 0;
      color: #8b949e;
      font-style: italic;
    }
    .date {
      color: #484f58;
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #21262d;
    }
    .link-card {
      display: block;
      padding: 0.75rem 1rem;
      margin: 0.5rem 0;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #58a6ff;
      text-decoration: none;
      word-break: break-all;
    }
    .link-card:hover {
      border-color: #58a6ff;
    }
    .empty {
      color: #484f58;
      text-align: center;
      padding: 3rem;
    }
  </style>
</head>
<body>
  <nav>
    <a href="nice-movie.html" ${file === "nice-movie.md" ? 'class="active"' : ""}>🎬 Movies</a>
    <a href="nice-music.html" ${file === "nice-music.md" ? 'class="active"' : ""}>🎵 Music</a>
    <a href="nice-book.html" ${file === "nice-book.md" ? 'class="active"' : ""}>📚 Books</a>
  </nav>
  <h1>${info.title}</h1>
  ${entries || '<p class="empty">まだエントリがありません</p>'}
</body>
</html>`;
}

// Build all pages
for (const file of FILES) {
  const htmlFile = file.replace(".md", ".html");
  const html = buildPage(file);
  fs.writeFileSync(path.join(DIST, htmlFile), html);
  console.log(`Built ${htmlFile}`);
}

// Index redirect
fs.writeFileSync(
  path.join(DIST, "index.html"),
  `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=nice-movie.html"></head></html>`
);
console.log("Built index.html");
