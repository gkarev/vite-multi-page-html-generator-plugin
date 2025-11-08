# 📄 Vite Multi-Page HTML Generator Plugin

> Production-ready Vite plugin for automatic multi-page static site generation with zero configuration

[![npm version](https://img.shields.io/npm/v/vite-multi-page-html-generator-plugin.svg)](https://www.npmjs.com/package/vite-multi-page-html-generator-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-4%20%7C%205%20%7C%206%20%7C%207-646CFF?logo=vite)](https://vitejs.dev/)

## Features

- **Zero config** - Works out of the box
- **Auto-discovery** - Finds all HTML files automatically
- **Security** - Path traversal protection (v2.0+)
- **Performance** - Async operations, non-blocking
- **TypeScript** - Full type definitions included
- **Safe merging** - Preserves existing Rollup config
- **Framework agnostic** - Works with React, Vue, Svelte, any Vite project
- **SVG integration** - Works with [vite-svg-sprite-generator-plugin](https://www.npmjs.com/package/vite-svg-sprite-generator-plugin)

## Installation

```bash
npm install -D vite-multi-page-html-generator-plugin
```

## Quick Start

### 1. Configure Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import multiPagePlugin from 'vite-multi-page-html-generator-plugin';

export default defineConfig({
  plugins: [multiPagePlugin()]
});
```

### 2. Create Your Pages

```
project/
├── index.html          ← Home page
├── about.html          ← About page
├── contact.html        ← Contact page
├── src/
│   └── main.js
└── vite.config.js
```

### 3. Build

```bash
npm run build
```

**Output:**

```
dist/
├── index.html
├── about.html
├── contact.html
└── assets/
    ├── main-[hash].js
    └── styles-[hash].css
```

## Configuration

```typescript
interface MultiPageOptions {
  htmlRoot?: string;                          // Default: project root
  exclude?: (string | RegExp)[];              // Default: []
  entryNameFormatter?: (name, file) => string // Default: undefined
}
```

### Basic Example

```javascript
multiPagePlugin({
  htmlRoot: 'src/pages',
  exclude: ['template.html', /test/i]
})
```

### Advanced Example

```javascript
multiPagePlugin({
  htmlRoot: 'src/pages',
  exclude: [
    'template.html',           // Exclude template files
    /^_/,                      // Exclude files starting with _
    /\.draft\.html$/           // Exclude draft files
  ],
  entryNameFormatter: (name, file) => {
    // Custom entry point naming
    return `page-${name}`;
  }
})
```

## How It Works

The plugin automatically discovers HTML files and configures Vite's build:

**Before (manual):**
```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html')
      }
    }
  }
});
```

**After (automatic):**
```javascript
export default defineConfig({
  plugins: [multiPagePlugin()]
  // Entry points auto-configured! ✨
});
```

### Build Process

1. **Discovery** - Scans `htmlRoot` for `.html` files
2. **Filtering** - Applies `exclude` patterns
3. **Entry Points** - Creates Rollup input config
4. **Merging** - Safely merges with existing config
5. **Build** - Vite builds all pages

## Key Features

### Auto-Discovery

```javascript
// No configuration needed!
multiPagePlugin()

// Finds all HTML files automatically:
// ✅ index.html
// ✅ about.html
// ✅ contact.html
```

### Flexible Exclusion

```javascript
multiPagePlugin({
  exclude: [
    'template.html',      // String match
    /test/i,              // RegExp pattern
    /^draft-/             // Files starting with "draft-"
  ]
})
```

### Security (v2.0+)

Automatic protection against path traversal attacks:

```javascript
// ❌ Blocked - outside project
multiPagePlugin({
  htmlRoot: '../../../etc'
})
// Error: Security: htmlRoot is outside project root

// ✅ Safe - inside project
multiPagePlugin({
  htmlRoot: 'src/pages'
})
```

### Safe Configuration

Preserves your existing Rollup config:

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        custom: 'custom-entry.html'
      },
      output: {
        manualChunks: {...}
      }
    }
  },
  plugins: [
    multiPagePlugin()  // Merges, doesn't overwrite
  ]
});

// Result: custom + auto-discovered entries ✅
```

## Integration

### With SVG Sprite Plugin

Perfect combination for static multi-page sites:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import multiPagePlugin from 'vite-multi-page-html-generator-plugin';
import svgSpritePlugin from 'vite-svg-sprite-generator-plugin';

export default defineConfig({
  plugins: [
    multiPagePlugin({
      htmlRoot: 'src/pages'
    }),
    svgSpritePlugin({
      iconsFolder: 'src/icons',
      treeShaking: true      // Each page gets only its icons
    })
  ]
});
```

**Result:** Full-featured static site with optimized SVG icons per page.

### With React/Vue/Svelte

```javascript
// React
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import multiPagePlugin from 'vite-multi-page-html-generator-plugin';

export default defineConfig({
  plugins: [
    react(),
    multiPagePlugin()
  ]
});

// Vue
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  plugins: [
    vue(),
    multiPagePlugin()
  ]
});

// Svelte
import { svelte } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({
  plugins: [
    svelte(),
    multiPagePlugin()
  ]
});
```

## Use Cases

### Multi-Page App

```
project/
├── index.html              # Landing page
├── dashboard.html          # Dashboard
├── settings.html           # Settings
└── src/
    ├── pages/
    │   ├── dashboard.js
    │   └── settings.js
    └── shared/
        └── utils.js
```

### Documentation Site

```
docs/
├── index.html              # Home
├── getting-started.html    # Guide
├── api-reference.html      # API docs
└── examples.html           # Examples
```

### Marketing Site

```
site/
├── index.html              # Home
├── features.html           # Features
├── pricing.html            # Pricing
├── about.html              # About
└── contact.html            # Contact
```

## Advanced

### Custom Entry Names

```javascript
multiPagePlugin({
  entryNameFormatter: (name, file) => {
    // name: 'about', file: '/path/to/about.html'
    
    // Add prefix
    return `page-${name}`;
    
    // Use full path as name
    return file.replace(/\//g, '-');
    
    // Custom logic
    return name.startsWith('admin-') 
      ? `admin/${name}` 
      : name;
  }
})
```

### Conditional Pages

```javascript
const isDev = process.env.NODE_ENV === 'development';

multiPagePlugin({
  exclude: isDev 
    ? []                      // Show all in dev
    : [/test/, /draft/]       // Hide test pages in prod
})
```

### Multiple Page Directories

```javascript
import { defineConfig } from 'vite';
import multiPagePlugin from 'vite-multi-page-html-generator-plugin';

export default defineConfig({
  plugins: [
    // Public pages
    multiPagePlugin({
      htmlRoot: 'src/public'
    }),
    // Admin pages (if needed, configure manually)
  ]
});
```

## Performance

### Build Speed

- **Async operations** - Non-blocking file system access
- **Efficient scanning** - Single directory traversal
- **Smart caching** - Leverages Vite's built-in cache

### Bundle Optimization

When pages share the same JavaScript:

```
3 pages, same JS import:

Without plugin:
  - Manual config for each page
  - Risk of misconfiguration

With plugin:
  - Auto-configured
  - Shared bundle: main-[hash].js
  - No duplication ✅
```

## Compatibility

- **Vite:** 4.x, 5.x, 6.x, 7.x
- **Node.js:** 14.18.0+
- **TypeScript:** Full support
- **OS:** Windows, macOS, Linux

## Migration Guide

### From v1.x to v2.0

**Breaking Changes:**
1. Path validation - `htmlRoot` must be inside project
2. Async operations - Fully non-blocking

**If using standard paths - no changes needed:**

```javascript
// ✅ Works the same
multiPagePlugin()

// ✅ Works the same
multiPagePlugin({
  htmlRoot: 'src/pages'
})
```

**If using paths outside project - now blocked:**

```javascript
// ❌ v1.x - worked (vulnerability!)
multiPagePlugin({
  htmlRoot: '../../../etc'
})

// ✅ v2.0 - throws error with explanation
// Error: Security: htmlRoot is outside project root
```

See [CHANGELOG.md](./CHANGELOG.md) for details.

## Links

- [npm Package](https://www.npmjs.com/package/vite-multi-page-html-generator-plugin)
- [GitHub Repository](https://github.com/gkarev/vite-multi-page-html-generator-plugin)
- [Issues](https://github.com/gkarev/vite-multi-page-html-generator-plugin/issues)
- [Changelog](./CHANGELOG.md)

## Related Plugins

- [vite-svg-sprite-generator-plugin](https://www.npmjs.com/package/vite-svg-sprite-generator-plugin) - SVG sprite generation with HMR

## License

MIT © [Karev G.S.](https://github.com/gkarev)

---

**Made with ❤️ for the Vite ecosystem**

