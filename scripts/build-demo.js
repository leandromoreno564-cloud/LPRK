// Genera la versión demo para GitHub Pages en la carpeta docs/
// Uso: npm run build-demo
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'docs');

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, 'public'), out, { recursive: true });
fs.copyFileSync(path.join(root, 'demo', 'demo-api.js'), path.join(out, 'js', 'demo-api.js'));
fs.writeFileSync(path.join(out, '.nojekyll'), ''); // evita el procesado de Jekyll en GitHub Pages

// Carga la API simulada antes que el resto de los scripts
for (const file of ['index.html', 'admin.html']) {
  const target = path.join(out, file);
  const html = fs.readFileSync(target, 'utf8').replace(
    '<script type="module"',
    '<script src="js/demo-api.js"></script>\n  <script type="module"'
  );
  fs.writeFileSync(target, html);
}
console.log('Demo generada en docs/');
