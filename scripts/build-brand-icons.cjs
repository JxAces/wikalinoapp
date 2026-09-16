// Run with sharp available (NODE_PATH may point to the bundled workspace runtime).
const fs = require('node:fs');
const sharp = require('sharp');
const green='#184C3C', gold='#EFBF38', cream='#FFF9ED';
const book=`<path d="M0 25 Q80 5 145 65 L145 240 Q78 181 20 189 Z" fill="${green}"/><path d="M165 65 Q230 5 310 25 L290 189 Q230 181 165 240 Z" fill="${gold}"/><path d="M40 56 Q92 57 120 83 M44 84 Q89 86 120 110 M187 83 Q221 57 270 56" fill="none" stroke="${cream}" stroke-width="8" stroke-linecap="round"/><path d="M18 212 Q89 207 155 269 Q221 207 292 212" fill="none" stroke="${green}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>`;
const svg=(w,h,body,bg=true)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bg?`<rect width="100%" height="100%" fill="${cream}"/>`:''}${body}</svg>`;
const title=(x,y,size)=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="bold" font-size="${size}" letter-spacing="-2" fill="${green}">Wikalinggo</text>`;
const iconBody=`<g transform="translate(326 258) scale(1.2)">${book}</g>${title(512,678,82)}`;
const markBody=`<g transform="translate(264 275) scale(1.6)">${book}</g>`;
const wordBody=`<g transform="translate(445 60)">${book}</g>${title(600,468,122)}<path d="M335 510 Q600 490 865 510" fill="none" stroke="${gold}" stroke-width="12" stroke-linecap="round"/>`;
async function save(name,source,sizes){fs.writeFileSync(`assets/branding/${name}.svg`,source);for(const [file,size] of sizes){ let pipeline=sharp(Buffer.from(source)).resize(size); if(name!=='wikalinggo-flat-adaptive') pipeline=pipeline.flatten({background:cream}).removeAlpha(); await pipeline.png().toFile(file); }}
(async()=>{
await save('wikalinggo-flat-icon',svg(1024,1024,iconBody),[['assets/images/wikalinggo-flat-icon.png',1024],['public/icons/wikalinggo-flat-192.png',192],['public/icons/wikalinggo-flat-512.png',512],['public/icons/wikalinggo-flat-apple.png',180]]);
await save('wikalinggo-flat-adaptive',svg(1024,1024,iconBody,false),[['assets/images/wikalinggo-flat-adaptive.png',1024]]);
await save('wikalinggo-flat-mark',svg(1024,1024,markBody),[['assets/images/wikalinggo-flat-favicon.png',48]]);
await save('wikalinggo-flat-wordmark',svg(1200,600,wordBody),[['assets/images/wikalinggo-flat-wordmark.png',1200]]);
console.log('Brand SVG sources and mobile PNGs generated.');
})();
