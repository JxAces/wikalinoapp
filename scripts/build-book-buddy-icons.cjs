// Requires sharp; SVG is the font-independent editable source of truth.
const fs = require('node:fs');
const sharp = require('sharp');
const source = fs.readFileSync('assets/branding/wikalinggo-book-buddy-v2.svg');
async function main() {
  for (const size of [48, 180, 192, 512, 1024]) {
    const file = size === 1024 ? 'assets/images/wikalinggo-book-buddy-v2.png'
      : `public/icons/wikalinggo-buddy-v2-${size}.png`;
    await sharp(source).resize(size).flatten({ background: '#164D3D' }).removeAlpha().png().toFile(file);
  }
  // Additional margin keeps the entire character inside circular launcher masks.
  const foreground = await sharp(source).resize(390).png().toBuffer();
  await sharp({create:{width:512,height:512,channels:3,background:'#164D3D'}})
    .composite([{input:foreground,left:61,top:61}]).removeAlpha().png()
    .toFile('public/icons/wikalinggo-buddy-v2-maskable.png');
  console.log('Book buddy icons exported.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
