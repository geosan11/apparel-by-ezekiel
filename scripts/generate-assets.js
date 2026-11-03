import fs from 'node:fs';
import path from 'node:path';

const designsDir = path.resolve('public/designs');
const imagesDir = path.resolve('public/images');
fs.mkdirSync(designsDir, { recursive: true });
fs.mkdirSync(imagesDir, { recursive: true });

// 1. Logo SVG (wordmark)
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 48" width="320" height="48" fill="none">
  <style>
    .brand-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; font-weight: 600; letter-spacing: 0.22em; fill: #F6F3EE; }
    .brand-sub { font-family: 'Inter', -apple-system, sans-serif; font-size: 8px; font-weight: 500; letter-spacing: 0.35em; fill: #B89B6A; }
  </style>
  <text x="160" y="24" text-anchor="middle" class="brand-title">APPAREL BY EZEKIEL</text>
  <text x="160" y="38" text-anchor="middle" class="brand-sub">LAGOS • BESPOKE TAILORING</text>
  <line x1="120" y1="44" x2="200" y2="44" stroke="#B89B6A" stroke-width="0.75" stroke-opacity="0.6"/>
</svg>`;
fs.writeFileSync(path.join(imagesDir, 'logo.svg'), logoSvg);

// Hero SVG
const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
  <defs>
    <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0E0E0E"/>
      <stop offset="50%" stop-color="#181614"/>
      <stop offset="100%" stop-color="#0A0A0A"/>
    </linearGradient>
    <linearGradient id="goldSheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#D4BC91" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#9A7B48" stop-opacity="0.7"/>
    </linearGradient>
    <radialGradient id="spotlight" cx="0.5" cy="0.4" r="0.6">
      <stop offset="0%" stop-color="#B89B6A" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#0E0E0E" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#heroBg)"/>
  <rect width="1200" height="900" fill="url(#spotlight)"/>
  
  <!-- Architectural lines -->
  <line x1="120" y1="0" x2="120" y2="900" stroke="#F6F3EE" stroke-opacity="0.04" stroke-width="1"/>
  <line x1="1080" y1="0" x2="1080" y2="900" stroke="#F6F3EE" stroke-opacity="0.04" stroke-width="1"/>
  <circle cx="600" cy="450" r="320" stroke="#B89B6A" stroke-opacity="0.08" stroke-width="1" fill="none"/>
  
  <!-- Stylized Agbada / Garment Silhouette -->
  <g transform="translate(600, 480)">
    <!-- Broad Agbada Drape -->
    <path d="M-280,320 L-260,-40 L-100,-140 L-40,-160 C-20,-170 20,-170 40,-160 L100,-140 L260,-40 L280,320 C200,280 80,260 0,260 C-80,260 -200,280 -280,320 Z" fill="#141312" stroke="#B89B6A" stroke-opacity="0.35" stroke-width="1.5"/>
    
    <!-- Chest Embroidery Motif -->
    <path d="M-70,-110 L0,-40 L70,-110 L0,-180 Z" stroke="url(#goldSheen)" stroke-width="2" fill="none"/>
    <path d="M-45,-110 L0,-65 L45,-110 L0,-155 Z" stroke="url(#goldSheen)" stroke-width="1" stroke-dasharray="3,3" fill="none"/>
    <line x1="0" y1="-40" x2="0" y2="180" stroke="url(#goldSheen)" stroke-width="2" stroke-linecap="round"/>
    
    <!-- Inner Tunic Placket -->
    <rect x="-18" y="-60" width="36" height="240" rx="3" fill="#0D0D0D" stroke="#8A847C" stroke-opacity="0.4"/>
    <circle cx="0" cy="-30" r="3.5" fill="#B89B6A"/>
    <circle cx="0" cy="10" r="3.5" fill="#B89B6A"/>
    <circle cx="0" cy="50" r="3.5" fill="#B89B6A"/>
    <circle cx="0" cy="90" r="3.5" fill="#B89B6A"/>
    <circle cx="0" cy="130" r="3.5" fill="#B89B6A"/>

    <!-- Geometric West African linework -->
    <g stroke="#B89B6A" stroke-opacity="0.25" stroke-width="1">
      <path d="M-180,60 L-140,20 L-100,60"/>
      <path d="M180,60 L140,20 L100,60"/>
      <path d="M-220,160 L-160,100 L-100,160"/>
      <path d="M220,160 L160,100 L100,160"/>
    </g>
  </g>
  
  <!-- Placeholder label -->
  <rect x="500" y="830" width="200" height="28" rx="14" fill="#000000" fill-opacity="0.6" stroke="#B89B6A" stroke-opacity="0.3"/>
  <text x="600" y="848" text-anchor="middle" font-family="'Inter', sans-serif" font-size="10" font-weight="600" letter-spacing="0.2em" fill="#F6F3EE">COLLECTION 2026/27</text>
</svg>`;
fs.writeFileSync(path.join(imagesDir, 'hero.svg'), heroSvg);

// Style definitions for the 8 designs
const designs = [
  {
    name: 'imperial-agbada',
    title: 'THE IMPERIAL AGBADA',
    primaryColor: '#191715',
    patternColor: '#B89B6A',
    bg1: '#141210',
    bg2: '#0A0908',
    garmentType: 'agbada'
  },
  {
    name: 'obsidian-senator',
    title: 'OBSIDIAN SENATOR SUIT',
    primaryColor: '#121213',
    patternColor: '#8A847C',
    bg1: '#161617',
    bg2: '#0D0D0E',
    garmentType: 'senator'
  },
  {
    name: 'royal-velvet-kaftan',
    title: 'ROYAL VELVET KAFTAN',
    primaryColor: '#0E131C',
    patternColor: '#B89B6A',
    bg1: '#0A0E14',
    bg2: '#05070B',
    garmentType: 'kaftan'
  },
  {
    name: 'grandeur-tuxedo',
    title: 'THE GRANDEUR TUXEDO',
    primaryColor: '#EBE5DC',
    patternColor: '#1A1A1A',
    bg1: '#1A1816',
    bg2: '#0E0D0C',
    garmentType: 'tuxedo'
  },
  {
    name: 'sahara-linen-set',
    title: 'SAHARA LINEN SET',
    primaryColor: '#C4BBAF',
    patternColor: '#8A847C',
    bg1: '#1D1C19',
    bg2: '#12110F',
    garmentType: 'kaftan'
  },
  {
    name: 'signature-safari-jacket',
    title: 'SIGNATURE SAFARI CUT',
    primaryColor: '#282C24',
    patternColor: '#B89B6A',
    bg1: '#141712',
    bg2: '#0B0D0A',
    garmentType: 'safari'
  },
  {
    name: 'monarch-brocade',
    title: 'MONARCH BROCADE SET',
    primaryColor: '#0E231B',
    patternColor: '#B89B6A',
    bg1: '#091611',
    bg2: '#040B08',
    garmentType: 'agbada'
  },
  {
    name: 'aura-kimono-kaftan',
    title: 'AURA KIMONO KAFTAN',
    primaryColor: '#1E2024',
    patternColor: '#8A847C',
    bg1: '#141517',
    bg2: '#0A0B0C',
    garmentType: 'kimono'
  }
];

function generateCardSvg(d) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <defs>
    <linearGradient id="bg-${d.name}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${d.bg1}"/>
      <stop offset="100%" stop-color="${d.bg2}"/>
    </linearGradient>
    <radialGradient id="glow-${d.name}" cx="0.5" cy="0.45" r="0.5">
      <stop offset="0%" stop-color="${d.patternColor}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${d.bg2}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#bg-${d.name})"/>
  <rect width="800" height="1000" fill="url(#glow-${d.name})"/>
  
  <!-- Subtle Framing -->
  <rect x="24" y="24" width="752" height="952" fill="none" stroke="${d.patternColor}" stroke-opacity="0.12" stroke-width="1"/>
  
  <!-- Garment Illustration -->
  <g transform="translate(400, 520)">
    ${getGarmentVector(d.garmentType, d.primaryColor, d.patternColor, false)}
  </g>
  
  <!-- Brand and Title Header in SVG -->
  <text x="400" y="80" text-anchor="middle" font-family="'Cormorant Garamond', Georgia, serif" font-size="28" font-weight="600" letter-spacing="0.18em" fill="#F6F3EE">${d.title}</text>
  <text x="400" y="108" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="500" letter-spacing="0.25em" fill="${d.patternColor}">EZEKIEL BESPOKE ATELIER</text>
  
  <!-- Placeholder indicator -->
  <rect x="300" y="920" width="200" height="26" rx="13" fill="#000000" fill-opacity="0.5" stroke="${d.patternColor}" stroke-opacity="0.25"/>
  <text x="400" y="937" text-anchor="middle" font-family="'Inter', sans-serif" font-size="9" font-weight="500" letter-spacing="0.15em" fill="#8A847C">PREVIEW PLACEHOLDER</text>
</svg>`;
}

function generateOverlaySvg(d) {
  // Transparent cutout for Virtual Try-on overlay
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">
  <g transform="translate(300, 360)">
    ${getGarmentVector(d.garmentType, d.primaryColor, d.patternColor, true)}
  </g>
</svg>`;
}

function getGarmentVector(type, primary, accent, isOverlay) {
  const strokeColor = accent;
  const strokeOp = isOverlay ? '0.85' : '0.45';

  if (type === 'agbada') {
    return `
      <!-- Agbada Wings -->
      <path d="M-240,240 L-220,-30 L-80,-120 C-40,-135 40,-135 80,-120 L220,-30 L240,240 C160,210 60,195 0,195 C-60,195 -160,210 -240,240 Z" 
        fill="${primary}" stroke="${strokeColor}" stroke-opacity="${strokeOp}" stroke-width="2"/>
      
      <!-- Central Tunic Body -->
      <path d="M-90,-110 L-90,260 L90,260 L90,-110 C60,-130 -60,-130 -90,-110 Z"
        fill="${primary}" stroke="${strokeColor}" stroke-opacity="${strokeOp}" stroke-width="1.5"/>
        
      <!-- Neck Cutout Curve -->
      <path d="M-40,-125 C-30,-70 30,-70 40,-125 C25,-140 -25,-140 -40,-125 Z" 
        fill="${isOverlay ? 'none' : '#0E0E0E'}" stroke="${strokeColor}" stroke-width="2"/>
      
      <!-- Chest Embroidery -->
      <path d="M-55,-65 L0,-10 L55,-65 L0,-120 Z" stroke="${strokeColor}" stroke-width="2.5" fill="none"/>
      <path d="M-35,-65 L0,-30 L35,-65 L0,-100 Z" stroke="${strokeColor}" stroke-width="1.2" stroke-dasharray="3,3" fill="none"/>
      
      <!-- Placket down -->
      <line x1="0" y1="-10" x2="0" y2="220" stroke="${strokeColor}" stroke-width="2"/>
      <circle cx="0" cy="20" r="3" fill="${strokeColor}"/>
      <circle cx="0" cy="60" r="3" fill="${strokeColor}"/>
      <circle cx="0" cy="100" r="3" fill="${strokeColor}"/>
      <circle cx="0" cy="140" r="3" fill="${strokeColor}"/>
    `;
  }

  if (type === 'senator') {
    return `
      <!-- Senator Tunic & Shoulders -->
      <path d="M-140,260 L-130,-70 L-70,-115 C-40,-125 40,-125 70,-115 L130,-70 L140,260 Z"
        fill="${primary}" stroke="${strokeColor}" stroke-opacity="${strokeOp}" stroke-width="2"/>
      
      <!-- Neck Cutout Curve -->
      <path d="M-36,-118 C-25,-85 25,-85 36,-118 C20,-130 -20,-130 -36,-118 Z" 
        fill="${isOverlay ? 'none' : '#0E0E0E'}" stroke="${strokeColor}" stroke-width="2"/>

      <!-- Asymmetric Senator Placket -->
      <path d="M15,-85 L15,220" stroke="${strokeColor}" stroke-width="2.5"/>
      <rect x="10" y="-30" width="10" height="24" rx="2" fill="${strokeColor}"/>
      <rect x="10" y="30" width="10" height="24" rx="2" fill="${strokeColor}"/>
      <rect x="10" y="90" width="10" height="24" rx="2" fill="${strokeColor}"/>
      
      <!-- Pocket welt -->
      <line x1="-70" y1="10" x2="-25" y2="10" stroke="${strokeColor}" stroke-width="2"/>
      <!-- Side slits -->
      <line x1="-125" y1="180" x2="-125" y2="260" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="2,2"/>
      <line x1="125" y1="180" x2="125" y2="260" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="2,2"/>
    `;
  }

  if (type === 'tuxedo') {
    return `
      <!-- Double-breasted Tuxedo Jacket -->
      <path d="M-150,260 L-145,-65 L-75,-115 C-45,-125 45,-125 75,-115 L145,-65 L150,260 Z"
        fill="${primary}" stroke="#0E0E0E" stroke-opacity="0.3" stroke-width="2"/>
        
      <!-- Satin Shawl Lapels -->
      <path d="M-75,-115 C-60,-30 -30,60 -10,95 L10,95 C30,60 60,-30 75,-115 C55,-128 -55,-128 -75,-115 Z"
        fill="#141414" stroke="#000" stroke-width="1.5"/>

      <!-- Inner Shirt & Bowtie -->
      <polygon points="0,-105 -25,-65 25,-65" fill="#F8F6F0"/>
      <!-- Bowtie -->
      <path d="M-14,-98 L14,-90 L-14,-90 L14,-98 Z" fill="#141414"/>

      <!-- Double breasted buttons -->
      <circle cx="-25" cy="80" r="5" fill="#141414" stroke="#8A847C" stroke-width="1"/>
      <circle cx="25" cy="80" r="5" fill="#141414" stroke="#8A847C" stroke-width="1"/>
      <circle cx="-25" cy="130" r="5" fill="#141414" stroke="#8A847C" stroke-width="1"/>
      <circle cx="25" cy="130" r="5" fill="#141414" stroke="#8A847C" stroke-width="1"/>
      <circle cx="-25" cy="180" r="5" fill="#141414" stroke="#8A847C" stroke-width="1"/>
      <circle cx="25" cy="180" r="5" fill="#141414" stroke="#8A847C" stroke-width="1"/>
    `;
  }

  if (type === 'safari') {
    return `
      <!-- Safari Jacket Body -->
      <path d="M-140,260 L-130,-70 L-70,-115 C-40,-125 40,-125 70,-115 L130,-70 L140,260 Z"
        fill="${primary}" stroke="${strokeColor}" stroke-opacity="${strokeOp}" stroke-width="2"/>
      
      <!-- Open Collar -->
      <path d="M-40,-118 L-20,-70 L0,-90 L20,-70 L40,-118 Z" 
        fill="${isOverlay ? 'none' : '#0E0E0E'}" stroke="${strokeColor}" stroke-width="2"/>
      
      <!-- Four Bellows Pockets -->
      <!-- Top Left -->
      <rect x="-85" y="-30" width="45" height="50" rx="3" fill="none" stroke="${strokeColor}" stroke-width="1.5"/>
      <path d="M-85,-20 L-40,-20" stroke="${strokeColor}" stroke-width="1.5"/>
      <!-- Top Right -->
      <rect x="40" y="-30" width="45" height="50" rx="3" fill="none" stroke="${strokeColor}" stroke-width="1.5"/>
      <path d="M40,-20 L85,-20" stroke="${strokeColor}" stroke-width="1.5"/>
      <!-- Bottom Left -->
      <rect x="-95" y="100" width="55" height="65" rx="3" fill="none" stroke="${strokeColor}" stroke-width="1.5"/>
      <!-- Bottom Right -->
      <rect x="40" y="100" width="55" height="65" rx="3" fill="none" stroke="${strokeColor}" stroke-width="1.5"/>
      
      <!-- Center Placket -->
      <line x1="0" y1="-70" x2="0" y2="260" stroke="${strokeColor}" stroke-width="2"/>
      <circle cx="0" cy="-20" r="4" fill="${strokeColor}"/>
      <circle cx="0" cy="40" r="4" fill="${strokeColor}"/>
      <circle cx="0" cy="100" r="4" fill="${strokeColor}"/>
      <circle cx="0" cy="160" r="4" fill="${strokeColor}"/>
    `;
  }

  // Fallback / Kaftan / Kimono
  return `
    <!-- Kaftan/Kimono Silhouette -->
    <path d="M-135,260 L-125,-70 L-65,-115 C-35,-125 35,-125 65,-115 L125,-70 L135,260 Z"
      fill="${primary}" stroke="${strokeColor}" stroke-opacity="${strokeOp}" stroke-width="2"/>
    
    <!-- Neck / Collar -->
    <path d="M-34,-118 C-20,-80 20,-80 34,-118 Z" 
      fill="${isOverlay ? 'none' : '#0E0E0E'}" stroke="${strokeColor}" stroke-width="2"/>
    
    <!-- Minimalist Long Placket -->
    <line x1="0" y1="-80" x2="0" y2="160" stroke="${strokeColor}" stroke-width="2"/>
    <circle cx="0" cy="-40" r="2.5" fill="${strokeColor}"/>
    <circle cx="0" cy="0" r="2.5" fill="${strokeColor}"/>
    <circle cx="0" cy="40" r="2.5" fill="${strokeColor}"/>
    <circle cx="0" cy="80" r="2.5" fill="${strokeColor}"/>
    
    <!-- Hem Trim -->
    <line x1="-120" y1="240" x2="120" y2="240" stroke="${strokeColor}" stroke-width="1" stroke-opacity="0.5"/>
  `;
}

// Generate all cards and overlays
for (const d of designs) {
  const cardSvg = generateCardSvg(d);
  fs.writeFileSync(path.join(designsDir, `${d.name}.svg`), cardSvg);
  const overlaySvg = generateOverlaySvg(d);
  fs.writeFileSync(path.join(designsDir, `${d.name}-overlay.svg`), overlaySvg);
}

console.log('Successfully generated SVGs for 8 designs, hero, and logo.');
