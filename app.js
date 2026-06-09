// ─── STATE MANAGEMENT ─────────────────────────────────
const state = {
  currentImageBase64: '',
  extractedColors: [],
  styleCategory: 'minimal',
  activeModifiers: new Set(),
  isGridVisible: false,
  activeFormat: 'midjourney'
};

// ─── STYLE SCHEMAS FOR HEURISTIC CLASSIFIER ───────────
const styleSchemas = {
  minimal: {
    name: "Minimalist Light UI / Editorial",
    summary: "Sleek, minimalist editorial aesthetic with high contrast, extensive whitespace, and clean geometric structures. Feels professional, premium, and calm.",
    keywords: ["Minimalist", "Editorial", "Whitespace", "High Contrast", "Tailwind CSS", "Geometric Grid", "Clean Layout", "Professional"],
    typography: "Clean geometric neo-grotesque sans-serif (such as Inter or SF Pro Display) paired with bold titles and tabular monospaced numbers.",
    layout: "Strict, containerized Bento Grid arrangement with clear margins, centered layout elements, and content grouped using visual boundaries.",
    spacing: "Generous spacing grid alignment with extensive margins (24px+ card gaps) and 50% screen empty space to direct attention toward CTA targets.",
    details: "Subtle drop shadows, micro-borders (1px solid), interactive hover transitions, and round buttons with subtle inner reflection lines.",
    promptBase: "A sleek minimalist light-themed interface canvas, clean Bento grid showing features, 8px padding system, premium sans-serif typography, high contrast, clean and highly aesthetic user interface"
  },
  dark: {
    name: "Modern Dark Mode SaaS",
    summary: "Deep, rich dark interface with subtle borders, glowing accent borders, and clean layout cards. Feels premium, developer-focused, and state-of-the-art.",
    keywords: ["Dark Mode", "SaaS Dashboard", "Glassmorphism", "Deep Contrast", "Developer Aesthetic", "Bento Grid", "Muted Details"],
    typography: "Inter or SF Pro Mono for UI, paired with tabular numbers and bold labels. Contrast ratio maintained using bright text on pitch-black surfaces.",
    layout: "Layered layouts with card panels floating on a dark gradient background. Flexible side-by-side grids on desktop.",
    spacing: "Compact 16px layouts, balanced padding metrics, and container blocks centered on screen.",
    details: "Glassmorphic backdrop blur (24px), delicate glowing borders, subtle radial shadow drops, and crisp outline buttons.",
    promptBase: "Premium dark-themed SaaS interface layout, dark gradients, glassmorphism cards, neon highlights, bento grid features, highly optimized dashboard structure"
  },
  cyber: {
    name: "Cyberpunk / High-Density Sci-Fi",
    summary: "Futuristic cyberpunk command-center interface, utilizing glowing borders, dark neon gradients, and dense information widgets.",
    keywords: ["Cyberpunk", "Neon Dashboard", "Vibrant Gradients", "Sci-Fi UI", "HUD Glow", "High Density", "Framer Motion"],
    typography: "Futuristic monospaced typeface (like JetBrains Mono or Space Grotesk) with small pill badges and high-visibility titles.",
    layout: "Multi-layered dashboard design. Compact widgets organized in symmetrical sidebars, interactive charts, and floating terminal panels.",
    spacing: "Highly dense grid. Tiny padding parameters (8-12px) to maximize the amount of statistics and indicators visible per viewport.",
    details: "Active status glows, scanning laser lines, blur reflections, color-coded badges, and delicate technical metrics.",
    promptBase: "Sci-fi cyberpunk HUD command dashboard interface, neon cyan and violet wireframe elements, glowing status monitors, dark mode glassmorphism panels, interactive data charts"
  },
  organic: {
    name: "Warm Organic / Artisanal Brand",
    summary: "Warm, earthy brand presentation. Feels organic, eco-friendly, artisanal, and grounded in craftsmanship and luxury branding.",
    keywords: ["Organic", "Artisanal", "Earth Tones", "Warm Canvas", "Soft Shadows", "Craftsmanship", "D2C Brand", "Elegant Serif"],
    typography: "Elegant, high-contrast Editorial Serif (such as Lora or Playfair Display) for header titles paired with warm, low-contrast humanistic sans-serif for description elements.",
    layout: "Asymmetric grid blocks, full-bleed images, overlapping details, and storytelling text flows that guide the viewer through product craft.",
    spacing: "Relaxed layout pacing. Large, open gutters (32px+), asymmetrical gaps, and breathable side columns for an unhurried visual feeling.",
    details: "Soft earthy textures, circular badge details, subtle animated page entries, and organic outlines without harsh borders.",
    promptBase: "Elegant, warm-toned D2C artisanal landing page, earth tone color system, premium editorial serif typography, asymmetric layouts, soft organic shadows, warm brand aesthetic"
  }
};

// Modifiers description map for prompt customizer
const modifierTexts = {
  glass: "incorporating semi-transparent glassmorphic panels with 24px backdrop blur and 1px white border lines",
  cyber: "infused with glowing neon status indicators and active ambient radial light glows",
  minimal: "surrounded by generous whitespace margins, clean borders, and minimalist canvas pacing",
  "3d": "featuring subtle 3D claymorphic depth elements and soft layered drop shadows",
  handdrawn: "enriched with soft hand-drawn illustrations and organic, sketchy UI borders"
};

// ─── DOM SELECTORS ────────────────────────────────────
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImgBtn = document.getElementById('remove-img-btn');
const toggleGridBtn = document.getElementById('toggle-grid-btn');
const gridOverlay = document.getElementById('grid-overlay');

const outputWelcome = document.getElementById('output-welcome');
const outputLoading = document.getElementById('output-loading');
const outputResults = document.getElementById('output-results');
const loadingStatus = document.getElementById('loading-status');

const styleSummaryText = document.getElementById('style-summary-text');
const keywordsTags = document.getElementById('keywords-tags');
const colorPaletteContainer = document.getElementById('color-palette-container');
const elementTypography = document.getElementById('element-typography');
const elementLayout = document.getElementById('element-layout');
const elementSpacing = document.getElementById('element-spacing');
const elementDetails = document.getElementById('element-details');
const readyPrompt = document.getElementById('ready-prompt');
const copyPromptBtn = document.getElementById('copy-prompt-btn');

const paletteCheckerWidget = document.getElementById('palette-checker-widget');
const contrastRows = document.getElementById('contrast-rows');
const quantizerCanvas = document.getElementById('quantizer-canvas');
const chipButtons = document.querySelectorAll('.chip-btn');
const demoButtons = document.querySelectorAll('.demo-btn');

// ─── INITIALIZATION ───────────────────────────────────
// Register global error notifications for offline debugging immediately
window.addEventListener('error', (event) => {
  if (typeof showNotification === 'function') {
    showNotification('System Error', event.message || 'An unexpected error occurred.', 'danger');
  }
});
window.addEventListener('unhandledrejection', (event) => {
  if (typeof showNotification === 'function') {
    showNotification('System Error', event.reason?.message || 'An unexpected promise rejection occurred.', 'danger');
  }
});

// Run setup immediately since DOM elements are already parsed above the script tag
setupEventListeners();

// ─── EVENT LISTENERS ──────────────────────────────────
function setupEventListeners() {
  // Drag and Drop
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  });

  // Trigger file selection when clicking anywhere on the dropzone
  dropzone.addEventListener('click', (e) => {
    if (e.target !== fileInput) {
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      processImageFile(e.target.files[0]);
    }
  });

  removeImgBtn.addEventListener('click', removeImage);


  // Layout Grid Overlay Button Toggle
  toggleGridBtn.addEventListener('click', () => {
    state.isGridVisible = !state.isGridVisible;
    if (state.isGridVisible) {
      gridOverlay.classList.remove('hidden');
      toggleGridBtn.classList.add('active');
    } else {
      gridOverlay.classList.add('hidden');
      toggleGridBtn.classList.remove('active');
    }
  });

  // Prompt Modifier Chips
  chipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modifier = btn.getAttribute('data-modifier');
      if (state.activeModifiers.has(modifier)) {
        state.activeModifiers.delete(modifier);
        btn.classList.remove('active');
      } else {
        state.activeModifiers.add(modifier);
        btn.classList.add('active');
      }
      regeneratePrompt();
    });
  });

  // Demo buttons
  demoButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const demoKey = btn.getAttribute('data-demo');
      loadDemoPreset(demoKey);
    });
  });

  // Framer Segment Control
  const segmentBtns = document.querySelectorAll('.segment-btn');
  const segmentPill = document.getElementById('active-segment-pill');

  segmentBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      segmentBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFormat = btn.getAttribute('data-format');
      
      // Shift pill
      if (segmentPill) {
        segmentPill.style.transform = `translateX(${index * 102}%)`;
      }
      
      regeneratePrompt();
    });
  });

  // Copy Prompt Action
  copyPromptBtn.addEventListener('click', () => {
    const text = readyPrompt.innerText;
    copyToClipboard(text, copyPromptBtn, 'Copy Prompt', 'Copied!');
  });
}

// ─── FILE PROCESSING ──────────────────────────────────
function processImageFile(file) {
  try {
    if (!file) return;
    const isImage = (file.type && file.type.startsWith('image/')) || (file.name && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name));
    if (!isImage) {
      showNotification('Invalid File', 'Please upload a valid image file.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        state.currentImageBase64 = e.target.result;
        
        // Set UI preview
        imagePreview.src = e.target.result;
        dropzone.classList.add('hidden');
        previewContainer.classList.remove('hidden');
        
        // Run canvas extraction and heuristic analyzer
        analyzeUploadedImage();
        
        // Clear value to allow selecting same file again
        fileInput.value = '';
      } catch (err) {
        showNotification('Analysis Error', err.message || 'Failed to analyze the image.', 'danger');
        console.error(err);
      }
    };
    reader.onerror = () => {
      showNotification('Read Error', 'Failed to read the selected file.', 'danger');
    };
    reader.readAsDataURL(file);
  } catch (err) {
    showNotification('Upload Error', err.message || 'An error occurred during file selection.', 'danger');
    console.error(err);
  }
}

function removeImage() {
  state.currentImageBase64 = '';
  state.extractedColors = [];
  state.activeModifiers.clear();
  
  // Reset buttons
  chipButtons.forEach(btn => btn.classList.remove('active'));
  toggleGridBtn.classList.remove('active');
  gridOverlay.classList.add('hidden');
  state.isGridVisible = false;

  imagePreview.src = '';
  previewContainer.classList.add('hidden');
  dropzone.classList.remove('hidden');
  fileInput.value = '';
  
  outputWelcome.classList.remove('hidden');
  outputResults.classList.add('hidden');
  outputLoading.classList.add('hidden');
  paletteCheckerWidget.classList.add('hidden');
}

// ─── OFFLINE HEURISTIC & COLOR EXTRACTOR ──────────────
function analyzeUploadedImage() {
  // Trigger loading screen
  outputWelcome.classList.add('hidden');
  outputResults.classList.add('hidden');
  outputLoading.classList.remove('hidden');
  loadingStatus.innerText = "Processing image canvas and quantizing visual attributes...";

  // Load image into HTML Image object for canvas parsing
  const img = new Image();
  img.onload = () => {
    try {
      // 1. Color Extraction via Canvas
      state.extractedColors = extractDominantColors(img);
      
      // 2. Classify style based on luminance/contrast
      state.styleCategory = classifyStyleByColors(state.extractedColors);
      
      // 3. Render and show results
      setTimeout(() => {
        try {
          renderAnalysisResults();
        } catch (renderErr) {
          showNotification('Render Error', renderErr.message || 'Failed to render results.', 'danger');
          console.error(renderErr);
          outputLoading.classList.add('hidden');
          outputWelcome.classList.remove('hidden');
        }
      }, 1200); // UI breathing room delay
    } catch (analysisErr) {
      showNotification('Analysis Error', analysisErr.message || 'Failed to analyze the image.', 'danger');
      console.error(analysisErr);
      outputLoading.classList.add('hidden');
      outputWelcome.classList.remove('hidden');
    }
  };
  
  img.onerror = (err) => {
    console.error("Image loading failed:", err);
    showNotification('Error Parsing Image', 'The selected image could not be loaded locally.', 'danger');
    outputLoading.classList.add('hidden');
    outputWelcome.classList.remove('hidden');
  };
  
  img.src = state.currentImageBase64;
}

// Canvas extraction algorithm
function extractDominantColors(img) {
  const ctx = quantizerCanvas.getContext('2d');
  
  // Resize to 200x200 to capture small detailed components (borders, labels)
  quantizerCanvas.width = 200;
  quantizerCanvas.height = 200;
  ctx.drawImage(img, 0, 0, 200, 200);
  
  const imgData = ctx.getImageData(0, 0, 200, 200).data;
  
  // Sample pixels in a dense grid (every 2nd pixel, step by 8 indices)
  const colorsMap = {};
  for (let i = 0; i < imgData.length; i += 8) {
    const r = imgData[i];
    const g = imgData[i+1];
    const b = imgData[i+2];
    
    // Quantize colors slightly to bucket near values (grouping similar shades)
    const qr = Math.round(r / 10) * 10;
    const qg = Math.round(g / 10) * 10;
    const qb = Math.round(b / 10) * 10;
    const key = `${qr},${qg},${qb}`;
    
    colorsMap[key] = (colorsMap[key] || 0) + 1;
  }
  
  // Convert map to array and score by a combination of frequency and saturation boost
  const sortedColors = Object.entries(colorsMap)
    .map(([colorStr, count]) => {
      const [r, g, b] = colorStr.split(',').map(Number);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      const saturation = max === 0 ? 0 : delta / max;
      
      // Saturated accent colors get a boost so they are not drowned out by backgrounds
      const saturationBoost = 1 + (saturation * 5.0);
      const score = count * saturationBoost;
      
      return { r, g, b, count, score, saturation };
    })
    .sort((a, b) => b.score - a.score);
    
  // Filter out colors that are too close to each other to make a diverse palette
  const diversePalette = [];
  for (const c of sortedColors) {
    if (diversePalette.length >= 5) break;
    
    // Check if color is unique enough compared to already selected ones
    const isUnique = diversePalette.every(selected => {
      const distance = Math.sqrt(
        Math.pow(c.r - selected.r, 2) +
        Math.pow(c.g - selected.g, 2) +
        Math.pow(c.b - selected.b, 2)
      );
      
      // If either color is highly saturated, allow a lower distance threshold
      const threshold = (c.saturation > 0.3 || selected.saturation > 0.3) ? 22 : 35;
      return distance > threshold;
    });
    
    if (isUnique) {
      diversePalette.push(c);
    }
  }
  
  // Fill remaining slots from sorted list if we couldn't find 5 unique ones
  let backupIndex = 0;
  while (diversePalette.length < 5 && backupIndex < sortedColors.length) {
    const backupColor = sortedColors[backupIndex];
    const alreadyAdded = diversePalette.some(item => 
      item.r === backupColor.r && item.g === backupColor.g && item.b === backupColor.b
    );
    if (!alreadyAdded) {
      diversePalette.push(backupColor);
    }
    backupIndex++;
  }
  
  // Map to Hex
  return diversePalette.map(c => rgbToHex(c.r, c.g, c.b));
}

// Helper: RGB to Hex Converter
function rgbToHex(r, g, b) {
  const toHex = (val) => {
    const hex = val.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Classifier rule engine
function classifyStyleByColors(hexCodes) {
  // Convert hex codes to RGB for calculation
  const rgbColors = hexCodes.map(hex => hexToRgb(hex));
  
  let totalLuminance = 0;
  let totalSaturation = 0;
  let warmColorCount = 0;
  
  rgbColors.forEach(rgb => {
    // Relative Luminance formula
    const lum = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
    totalLuminance += lum;
    
    // Saturation and hue properties
    const max = Math.max(rgb.r, rgb.g, rgb.b);
    const min = Math.min(rgb.r, rgb.g, rgb.b);
    const delta = max - min;
    const sat = max === 0 ? 0 : delta / max;
    totalSaturation += sat;
    
    // Count warm colors (reds, warm yellows, oranges, golds)
    if (rgb.r > rgb.b * 1.3 && rgb.g > rgb.b * 0.9) {
      warmColorCount++;
    }
  });
  
  const avgLuminance = totalLuminance / rgbColors.length;
  const avgSaturation = totalSaturation / rgbColors.length;
  
  // Rules
  if (avgLuminance < 45) {
    // Very dark background
    if (avgSaturation > 0.4) {
      return 'cyber'; // Dark & highly saturated -> Cyberpunk
    }
    return 'dark'; // Dark & muted -> SaaS Dark Mode
  } else if (avgLuminance > 180) {
    return 'minimal'; // Very light -> Minimalist Light
  } else if (warmColorCount >= 2) {
    return 'organic'; // Warm earthy tones -> Artisanal Organic
  }
  
  return 'minimal'; // Default fallback
}

// Helper: Hex to RGB
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return { r: 128, g: 128, b: 128 };
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 128, g: 128, b: 128 };
}

// ─── RENDERING RESULTS ────────────────────────────────
function renderAnalysisResults() {
  outputLoading.classList.add('hidden');
  outputResults.classList.remove('hidden');
  paletteCheckerWidget.classList.remove('hidden');
  
  const schema = styleSchemas[state.styleCategory];
  
  // Style Summary
  styleSummaryText.innerText = schema.summary;
  
  // Keywords
  keywordsTags.innerHTML = '';
  schema.keywords.forEach(word => {
    const tag = document.createElement('span');
    tag.className = 'keyword-tag';
    tag.innerText = word;
    tag.addEventListener('click', () => {
      copyToClipboard(word, tag, word, 'Copied!');
    });
    keywordsTags.appendChild(tag);
  });
  
  // Render Palette Swatches
  colorPaletteContainer.innerHTML = '';
  state.extractedColors.forEach((hex, index) => {
    let label = 'Neutral/Body';
    if (index === 0) label = 'Primary (Bg/Dominant)';
    else if (index === 1) label = 'Secondary Canvas';
    else if (index === 2) label = 'Highlight Accent';
    else if (index === 3) label = 'Component Border';
    
    const swatchWrapper = document.createElement('div');
    swatchWrapper.className = 'color-swatch-item';
    swatchWrapper.title = `Copy ${hex} (${label})`;
    
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.backgroundColor = hex;
    
    const hexLabel = document.createElement('span');
    hexLabel.className = 'color-hex';
    hexLabel.innerText = hex;
    
    swatchWrapper.appendChild(swatch);
    swatchWrapper.appendChild(hexLabel);
    
    swatchWrapper.addEventListener('click', () => {
      copyToClipboard(hex, swatchWrapper, `Hex`, 'Copied!');
    });
    
    colorPaletteContainer.appendChild(swatchWrapper);
  });
  
  // UI breakdowns
  elementTypography.innerText = schema.typography;
  elementLayout.innerText = schema.layout;
  elementSpacing.innerText = schema.spacing;
  elementDetails.innerText = schema.details;
  
  // Generate Prompt
  regeneratePrompt();
  
  // Calculate and Render WCAG Contrast Widget
  renderContrastChecker();
}

// ─── DYNAMIC PROMPT BUILDER ───────────────────────────
function regeneratePrompt() {
  const schema = styleSchemas[state.styleCategory];
  if (!schema) return;
  
  const c = state.extractedColors;
  const bg = c[0] || '#060608';
  const card = c[1] || '#151412';
  const accent = c[2] || '#c8a84b';
  const trim = c[3] || '#c4522a';
  const fg = c[4] || '#ffffff';

  // Gather modifiers
  let modifiersList = [];
  state.activeModifiers.forEach(mod => {
    if (modifierTexts[mod]) {
      modifiersList.push(modifierTexts[mod]);
    }
  });

  let promptOutput = '';

  if (state.activeFormat === 'midjourney') {
    const modifierStr = modifiersList.length > 0 ? `, ${modifiersList.join(', ')}` : '';
    promptOutput = `A premium visual UI design mockup showcase of a ${schema.name}, flat vector graphics presentation, modern digital layout, ${schema.summary}. Strict color palette system: background ${bg}, container grids ${card}, highlight glows ${accent}, borders ${trim}, text ${fg}. Typography style: ${schema.typography}. Details: ${schema.details}${modifierStr}. Volumetric lighting, pixel-perfect clean vectors, trending on Dribbble, highly aesthetic, 8k resolution --v 6.0 --ar 16:9`;
  } 
  else if (state.activeFormat === 'dalle') {
    const modifierStr = modifiersList.length > 0 ? ` Make sure to incorporate styling elements like ${modifiersList.join(' and ')}.` : '';
    promptOutput = `A clean, flat user interface mockup for a ${schema.name} on a dark backdrop. The visual theme is defined by ${schema.summary}. The color scheme is strictly defined by background ${bg}, container cards ${card}, glowing accents of ${accent}, border lines of ${trim}, and details in ${fg}. It features: ${schema.layout}, ${schema.typography}, and ${schema.details}.${modifierStr} The visual presentation is highly polished, professional, and suitable for a high-end SaaS product showcase website, 8k resolution.`;
  } 
  else if (state.activeFormat === 'tailwind') {
    promptOutput = `<!-- VisualPrompt Generated SaaS Boilerplate -->
<!-- Aesthetic: ${schema.name} -->
<!-- Colors: Bg: ${bg} | Card: ${card} | Accent: ${accent} | Border: ${trim} | Text: ${fg} -->

<div class="min-h-screen p-8 transition-colors duration-300" style="background-color: ${bg}; color: ${fg}; font-family: sans-serif;">
  <div class="max-w-6xl mx-auto space-y-8">
    
    <!-- Header -->
    <header class="flex justify-between items-center pb-6 border-b" style="border-color: ${trim};">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg" style="background: linear-gradient(135deg, ${accent}, ${trim});"></div>
        <span class="text-lg font-bold tracking-tight">VisualPrompt App</span>
      </div>
      <button class="px-4 py-2 rounded-full text-xs font-bold transition-transform hover:scale-105" style="background-color: ${accent}; color: ${bg};">
        Launch Console
      </button>
    </header>

    <!-- Bento Grid Layout -->
    <main class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Primary Card (2 cols) -->
      <section class="md:col-span-2 p-8 rounded-2xl border transition-all hover:translate-y-[-2px]" style="background-color: ${card}; border-color: ${trim};">
        <h2 class="text-xl font-bold mb-2">Core Layout & Spacing</h2>
        <p class="text-sm opacity-60 mb-6">${schema.layout}. Alignment: ${schema.spacing}.</p>
        <div class="h-44 rounded-xl border border-dashed flex items-center justify-center" style="border-color: ${trim};">
          <span class="text-xs opacity-40">Interactive Component Slot</span>
        </div>
      </section>

      <!-- Sidebar Accent Card -->
      <section class="p-8 rounded-2xl border flex flex-col justify-between" style="background-color: ${card}; border-color: ${trim};">
        <div>
          <h3 class="text-lg font-bold mb-2">Typography & Specs</h3>
          <p class="text-sm opacity-70 mb-4">${schema.typography}</p>
        </div>
        <div class="pt-4 border-t" style="border-color: ${trim};">
          <span class="text-xs font-semibold uppercase tracking-wider opacity-50">Standout Detail:</span>
          <p class="text-xs mt-1">${schema.details}</p>
        </div>
      </section>

    </main>
  </div>
</div>`;
  }

  readyPrompt.innerText = promptOutput;
}

// ─── ACCESSIBILITY CONTRAST CHECKER (WIDGET) ──────────
function renderContrastChecker() {
  contrastRows.innerHTML = '';
  
  // Base background (Dominant Color)
  const bgHex = state.extractedColors[0] || '#050508';
  const bgRgb = hexToRgb(bgHex);
  const bgL = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // Check contrast of other colors against the background
  state.extractedColors.slice(1).forEach((hex, index) => {
    const fgRgb = hexToRgb(hex);
    const fgL = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
    
    // WCAG contrast ratio equation
    const ratio = (Math.max(bgL, fgL) + 0.05) / (Math.min(bgL, fgL) + 0.05);
    const formattedRatio = ratio.toFixed(1);
    
    let label = 'Secondary text contrast';
    if (index === 0) label = 'Primary text visibility';
    else if (index === 1) label = 'Accent element visibility';
    else if (index === 2) label = 'UI Borders & outline visibility';
    
    // Determine WCAG AA Rating
    let statusClass = 'status-pass';
    let statusText = 'PASS (AAA)';
    if (ratio >= 4.5) {
      statusClass = 'status-pass';
      statusText = 'PASS (AA)';
    } else if (ratio >= 3.0) {
      statusClass = 'status-warn';
      statusText = 'PASS (Large Text)';
    } else {
      statusClass = 'status-fail';
      statusText = 'FAIL (Poor Contrast)';
    }
    
    const row = document.createElement('div');
    row.className = 'contrast-row';
    row.innerHTML = `
      <div class="contrast-visual">
        <div class="contrast-swatch-dot" style="background-color: ${hex}"></div>
        <span class="contrast-label">${label} (${hex} vs ${bgHex})</span>
      </div>
      <div class="contrast-status">
        <span class="contrast-ratio">${formattedRatio}:1</span>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
    `;
    contrastRows.appendChild(row);
  });
}

// Helper: Calculate relative luminance
function getLuminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// ─── DEMO LOADER ──────────────────────────────────────
function loadDemoPreset(demoKey) {
  // Trigger loading screen
  outputWelcome.classList.add('hidden');
  outputResults.classList.add('hidden');
  outputLoading.classList.remove('hidden');
  loadingStatus.innerText = "Simulating pixel quantization on demo preset...";

  // Set mockup image dimensions & preview paths
  dropzone.classList.add('hidden');
  previewContainer.classList.remove('hidden');
  
  if (demoKey === 'minimal') {
    imagePreview.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23f8fafc"/><circle cx="300" cy="200" r="80" fill="%233b82f6"/><text x="50%25" y="90%25" font-family="sans-serif" font-size="20" fill="%2364748b" text-anchor="middle">Minimalist SaaS</text></svg>';
    state.extractedColors = ["#f8fafc", "#0f172a", "#3b82f6", "#64748b", "#e2e8f0"];
    state.styleCategory = 'minimal';
  } else if (demoKey === 'cyber') {
    imagePreview.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%2303001e"/><circle cx="300" cy="200" r="80" fill="%23ec4899"/><text x="50%25" y="90%25" font-family="sans-serif" font-size="20" fill="%2306b6d4" text-anchor="middle">Cyberpunk Dashboard</text></svg>';
    state.extractedColors = ["#03001e", "#ec4899", "#8b5cf6", "#06b6d4", "#3b0764"];
    state.styleCategory = 'cyber';
  } else if (demoKey === 'organic') {
    imagePreview.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23fcfaf2"/><circle cx="300" cy="200" r="80" fill="%238a9a86"/><text x="50%25" y="90%25" font-family="serif" font-size="20" fill="%232d2a26" text-anchor="middle">Artisanal Organic Brand</text></svg>';
    state.extractedColors = ["#fcfaf2", "#2d2a26", "#8a9a86", "#d6c5b0", "#b87d4b"];
    state.styleCategory = 'organic';
  }

  setTimeout(() => {
    renderAnalysisResults();
  }, 1000);
}

// ─── HELPERS ──────────────────────────────────────────
function copyToClipboard(text, element, originalLabel, successLabel) {
  navigator.clipboard.writeText(text).then(() => {
    // Show copy status micro-animation
    if (element.classList.contains('keyword-tag')) {
      element.style.borderColor = 'var(--success)';
      element.style.color = 'var(--success)';
      setTimeout(() => {
        element.style.borderColor = '';
        element.style.color = '';
      }, 1500);
    } else if (element.classList.contains('color-swatch-item')) {
      const hexSpan = element.querySelector('.color-hex');
      hexSpan.innerText = 'Copied';
      hexSpan.style.color = 'var(--success)';
      setTimeout(() => {
        hexSpan.innerText = text;
        hexSpan.style.color = '';
      }, 1500);
    } else {
      element.innerHTML = `<i data-lucide="check"></i> ${successLabel}`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      setTimeout(() => {
        element.innerHTML = `<i data-lucide="copy"></i> ${originalLabel}`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }, 1500);
    }
  });
}

function showNotification(title, message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.bottom = '24px';
  notification.style.right = '24px';
  notification.style.background = '#11111b';
  notification.style.border = '1px solid var(--surface-border)';
  notification.style.borderRadius = '8px';
  notification.style.padding = '16px 20px';
  notification.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
  notification.style.zIndex = '10000';
  notification.style.display = 'flex';
  notification.style.flexDirection = 'column';
  notification.style.gap = '4px';
  notification.style.maxWidth = '360px';
  notification.style.animation = 'slideIn 0.3s ease-out';
  
  if (type === 'success') notification.style.borderLeft = '4px solid var(--success)';
  else if (type === 'danger') notification.style.borderLeft = '4px solid var(--danger)';
  else if (type === 'warning') notification.style.borderLeft = '4px solid var(--warning)';
  else notification.style.borderLeft = '4px solid var(--accent)';
  
  notification.innerHTML = `
    <strong style="font-size: 13.5px; font-weight: 600; color: #fff;">${title}</strong>
    <span style="font-size: 12.5px; color: var(--text-muted);">${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    notification.addEventListener('animationend', () => notification.remove());
  }, 3000);
}

// Add CSS keyframes for sliding notification transitions
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes slideIn {
    from { transform: translateY(100px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(100px); opacity: 0; }
  }
`;
document.head.appendChild(styleSheet);
