const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

let html = `<!DOCTYPE html>
<html>
<head>
  <title>Gallery</title>
  <style>
    body { font-family: sans-serif; background: #eee; padding: 20px; }
    .card { background: white; padding: 15px; margin-bottom: 30px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    img { max-width: 100%; height: auto; display: block; margin-top: 10px; border: 1px solid #ccc; }
  </style>
</head>
<body>
  <h1>Gallery of Copied Images</h1>
`;

for (const file of files) {
  html += `
  <div class="card">
    <h3>${file}</h3>
    <img src="/temp-images/${file}" />
  </div>
  `;
}

html += `
</body>
</html>
`;

fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log('Generated index.html successfully with', files.length, 'images.');
