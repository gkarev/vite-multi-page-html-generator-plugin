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

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for details.

## 📄 License

MIT © Your Name

