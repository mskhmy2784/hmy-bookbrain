const fs = require('fs');
const path = require('path');

// SVGアイコンを生成
const generateSvgIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#2563eb"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white">
    📚
  </text>
</svg>
`;

// PNGの代わりにSVGを使用（ブラウザ互換性のため）
const sizes = [192, 512];

sizes.forEach(size => {
  const svg = generateSvgIcon(size);
  const filePath = path.join(__dirname, '..', 'public', 'icons', `icon-${size}.svg`);
  fs.writeFileSync(filePath, svg);
  console.log(`Generated: ${filePath}`);
});

console.log('Icons generated successfully!');
