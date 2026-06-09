# VisualPrompt - Design Style & AI Prompt Deconstructor

An elegant, **100% offline, client-side web application** that deconstructs any design reference image (landing pages, SaaS interfaces, posters, branding assets) into precise color palettes, layout composition guidelines, spacing metrics, typography systems, and copy-pasteable AI generation prompts for Midjourney, DALL-E 3, and Tailwind CSS.

Built with pure vanilla HTML, CSS (featuring **Riyan's Master UI/UX Glassmorphic Dark** design system), and JavaScript. **No API keys or internet connections required.**

---

## 🚀 Key Features

* **Canvas Pixel Quantization**: Samples pixel data directly inside the browser using HTML5 Canvas. Groups similar tones using Euclidean color-distance matching.
* **Vibrant Accent Booster**: Leverages a custom saturation-boosting algorithm to identify and extract small visual highlights (like CTA buttons, neon indicators, or micro-labels) that are usually drowned out by dominant backgrounds in standard color extractors.
* **Style Classifier Engine**: Calculates relative luminance and saturation metrics from extracted colors to automatically map the visual identity to one of four visual archetypes:
  * *Minimalist Light UI / Editorial*
  * *Modern Dark Mode SaaS*
  * *Cyberpunk / High-Density Sci-Fi HUD*
  * *Warm Organic / Artisanal Brand*
* **Dynamic Prompt Customizer**: Clickable modifier chips (Glassmorphism, Neon Glow, 3D Elements, Hand-drawn Detail) that instantly modify and append design instructions in real-time.
* **Framer-Style Toggle Controls**: A hardware-accelerated sliding segment tab control that translates a frosted-glass background pill behind prompt templates:
  * **Midjourney v6**: Descriptive paragraphs with high-end photographic lighting and parameters.
  * **DALL-E 3**: Detailed plain English specifications for ChatGPT.
  * **SaaS Code**: Instant **copy-pasteable responsive HTML/Tailwind CSS bento-grid boilerplate code** using your exact analyzed color hexes.
* **Interactive Fluid Widgets**:
  * **Layout Grid Overlay**: Projects a toggleable 3x3 layout wireframe grid on top of your preview.
  * **Visual Contrast Checker (WCAG 2.2)**: Calculates relative luminance ratios between the dominant background and the foreground accent/text colors to validate AA/AAA compliance dynamically.

---

## 🛠️ Tech Stack & Aesthetics

* **Frontend**: Vanilla HTML5, Vanilla JavaScript (ES6), Custom Spring CSS Transitions.
* **Typography**: Google Fonts Outfit & JetBrains Mono.
* **Design Profile**: *Obsidian Amber & Rust* (deep radial gradient backgrounds, translucent frosted-glass cards, physical noise/grain overlays).
* **Self-Contained**: No external bundlers, frameworks, node module dependencies, or vision model API endpoints. Runs completely in the browser.

---

## 💻 Local Setup & Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/RiyanKothari/Design-style-and-prompt-analyser.git
   cd Design-style-and-prompt-analyser
   ```

2. Start a local server (or simply double-click `index.html` to open directly):
   * Using Python:
     ```bash
     python -m http.server 3000
     ```
   * Using Node/Npx:
     ```bash
     npx serve
     ```

3. Open your browser and navigate to `http://localhost:3000`.

---

## ⚙️ How It Works (Under the Hood)

### Color Extraction & Clustering
The system downscales the uploaded image to `200x200` to preserve small borders and icons, reads the canvas pixel data, and scores color buckets:
$$\text{Score} = \text{PixelCount} \times (1 + \text{Saturation} \times 5.0)$$

It filters colors using an adaptive Euclidean distance formula:
$$\text{Distance} = \sqrt{(R_1-R_2)^2 + (G_1-G_2)^2 + (B_1-B_2)^2}$$
If either color is highly saturated (saturation $> 0.3$), the distance threshold is lowered to `22` (instead of `35`) to capture adjacent warm accents (like red and gold).

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
