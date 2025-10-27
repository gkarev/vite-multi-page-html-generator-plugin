# vite-multi-page-html-generator-plugin

> Vite plugin for automatic multi-page HTML entry point generation

[![npm version](https://img.shields.io/npm/v/vite-multi-page-html-generator-plugin.svg)](https://www.npmjs.com/package/vite-multi-page-html-generator-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🔍 **Auto-discovery** - Automatically finds all HTML files in your project
- ⚙️ **Configurable** - Flexible options for customizing behavior
- 🎯 **TypeScript Support** - Full TypeScript definitions included
- 📦 **Zero Dependencies** - No external dependencies required
- 🚀 **Performance** - Optimized for fast builds
- ♻️ **Backward Compatible** - Smooth migration from old option names

## 📦 Installation

```bash
npm install vite-multi-page-html-generator-plugin --save-dev
```

## 🚀 Quick Start

### Basic Usage

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import multiPageHtml from 'vite-multi-page-html-generator-plugin';

export default defineConfig({
  plugins: [
    multiPageHtml()
  ]
});
```

This will automatically find all `.html` files in the project root and create entry points for each one.

### Project Structure

```
project/
├── src/
│   ├── index.html          ← Main page
│   ├── about.html          ← Additional page
│   ├── contact.html        ← Additional page
│   └── assets/
│       ├── styles.css
│       └── main.js
├── package.json
└── vite.config.js
```

### Build Output

The plugin generates a **multi-page static website** during build:

```
dist/
├── index.html              ← Compiled main page
├── about.html              ← Compiled additional page
├── contact.html            ← Compiled additional page
└── assets/
    ├── main-[hash].js      ← Shared bundle (if all pages use the same JS)
    └── styles-[hash].css   ← Shared styles
```

Each HTML file becomes a separate static page. If all pages reference the same JavaScript file, they will share a single bundle.

### Custom Configuration

```javascript
export default defineConfig({
  plugins: [
    multiPageHtml({
      htmlRoot: 'src/pages',
      exclude: ['template.html'],
      formatEntryName: (name) => `page-${name}`
    })
  ]
});
```

## 📖 Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `htmlRoot` | `string` | `undefined` | Custom folder to search for HTML files |
| `exclude` | `string[]` | `[]` | Files to exclude from entry points |
| `formatEntryName` | `Function` | `undefined` | Custom function to format entry names |

## 🤝 Integration with vite-svg-sprite-generator-plugin

This plugin works perfectly with [vite-svg-sprite-generator-plugin](https://www.npmjs.com/package/vite-svg-sprite-generator-plugin) for building static multi-page sites with SVG icons:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import svgSprite from 'vite-svg-sprite-generator-plugin';
import multiPageHtml from 'vite-multi-page-html-generator-plugin';

export default defineConfig({
  plugins: [
    multiPageHtml(),  // Generate multiple pages
    svgSprite({
      iconsFolder: 'src/icons',
      optimize: true
    })
  ]
});
```

This combination creates a fully static multi-page website with optimized SVG icons. Each page can share the same bundle or use page-specific bundles depending on your setup.

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for details.

## 📄 License

MIT © Your Name

