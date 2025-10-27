import { resolve } from 'path';
import fs from 'fs';

/**
 * Vite plugin for multi-page applications that automatically discovers HTML files
 * and generates entry points for the build process.
 * 
 * @param {Object} options - Configuration options
 * @param {(string|RegExp)[]} options.exclude - Patterns to exclude
 * @param {Function} options.entryNameFormatter - Function to format entry names
 * @param {string} options.htmlRoot - Root directory containing HTML files
 * @returns {Object} Vite plugin
 */
export default function viteMultiPageHtmlGeneratorPlugin(options = {}) {
  const { exclude = [], entryNameFormatter, htmlRoot } = options;
  
  function getRoot(config) {
    if (htmlRoot) {
      // Use config.root as base path (critical fix)
      return resolve(config.root || process.cwd(), htmlRoot);
    }
    return config.root || process.cwd();
  }
  
  return {
    name: 'vite-multi-page-html-generator',
    apply: 'build',
    
    config(config) {
      const root = getRoot(config);
      const entries = discoverHtmlFiles(root, { exclude, entryNameFormatter });
      
      if (!entries || Object.keys(entries).length === 0) {
        console.log('[vite-multi-page-html-generator] No HTML entries found');
        return {};
      }
      
      console.log(`[vite-multi-page-html-generator] Found ${Object.keys(entries).length} HTML entries: ${Object.keys(entries).join(', ')}`);
      
      // Preserve existing rollupOptions to avoid overwriting user's configuration
      return {
        build: {
          rollupOptions: {
            ...config.build?.rollupOptions,
            input: entries
          }
        }
      };
    }
  };
}

function validateRoot(root) {
  if (!root || typeof root !== 'string') return { valid: false, error: 'Invalid root directory: ' + root };
  if (!fs.existsSync(root)) return { valid: false, error: 'Root directory does not exist: ' + root };
  return { valid: true };
}

function readDirectoryFiles(root) {
  try {
    const files = fs.readdirSync(root);
    return Array.isArray(files) ? files : [];
  } catch (error) {
    console.error('[vite-multi-page-html-generator] Error reading directory:', error.message);
    return [];
  }
}

function isExcluded(file, exclude) {
  return exclude.some(pattern => {
    // Support RegExp patterns
    if (pattern instanceof RegExp) {
      return pattern.test(file);
    }
    // Support string patterns: exact match with or without .html extension
    const baseName = file.replace(/\.html$/, '');
    return file === pattern || baseName === pattern;
  });
}

function filterHtmlFiles(files, exclude = []) {
  return files.filter(file => 
    file.endsWith('.html') && 
    !file.startsWith('.') && 
    !isExcluded(file, exclude)
  );
}

function createEntryMapping(htmlFiles, root, entryNameFormatter) {
  const entries = {};
  
  htmlFiles.sort().forEach(file => {
    try {
      let name = file.replace(/\.html$/, '');
      
      if (typeof entryNameFormatter === 'function') {
        name = entryNameFormatter(name, file);
        if (typeof name !== 'string') {
          console.warn(`[vite-multi-page-html-generator] entryNameFormatter must return a string, got: ${typeof name} (file: ${file})`);
          return;
        }
      }
      
      // Protection against duplicates
      if (entries[name]) {
        console.warn(`[vite-multi-page-html-generator] Duplicate entry name: ${name} (files: ${entries[name].split(/[/\\]/).pop()}, ${file})`);
        return;
      }
      
      entries[name] = resolve(root, file);
    } catch (error) {
      console.error(`[vite-multi-page-html-generator] Error processing file ${file}:`, error.message);
    }
  });
  
  return entries;
}

function discoverHtmlFiles(root, options = {}) {
  const { exclude = [], entryNameFormatter } = options;
  
  const validation = validateRoot(root);
  if (!validation.valid) {
    console.warn('[vite-multi-page-html-generator]', validation.error);
    return null;
  }
  
  try {
    const files = readDirectoryFiles(root);
    if (files.length === 0) return null;
    
    const htmlFiles = filterHtmlFiles(files, exclude);
    if (htmlFiles.length === 0) return null;
    
    return createEntryMapping(htmlFiles, root, entryNameFormatter);
  } catch (error) {
    console.error('[vite-multi-page-html-generator] Error discovering files:', error.message);
    return null;
  }
}

