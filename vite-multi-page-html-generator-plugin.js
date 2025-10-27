import { resolve } from 'path';
import fs from 'fs';

export default function viteMultiPageHtmlGeneratorPlugin(options = {}) {
  const { exclude = [], formatEntryName, entryNameFormatter, htmlRoot, rootFolder } = options;
  const entryFormatter = formatEntryName || entryNameFormatter;
  const htmlRootDir = htmlRoot || rootFolder;
  
  return {
    name: 'vite-multi-page-html-generator',
    apply: 'build',
    configResolved(config) {
      const root = htmlRootDir ? resolve(process.cwd(), htmlRootDir) : (config.root || process.cwd());
      if (!fs.existsSync(root)) {
        console.warn(`[vite-multi-page-html-generator] WARNING: Directory ${root} does not exist.`);
      }
    },
    config(config) {
      const root = htmlRootDir ? resolve(process.cwd(), htmlRootDir) : (config.root || process.cwd());
      const entries = discoverHtmlFiles(root, { exclude, entryNameFormatter: entryFormatter });
      if (!entries || Object.keys(entries).length === 0) return {};
      return { build: { rollupOptions: { input: entries } } };
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

function filterHtmlFiles(files, exclude = []) {
  return files.filter(file => file.endsWith('.html') && !file.startsWith('.') && !exclude.some(pattern => file.includes(pattern)));
}

function createEntryMapping(htmlFiles, root, entryNameFormatter) {
  const entries = {};
  htmlFiles.sort().forEach(file => {
    let name = file.replace('.html', '');
    if (typeof entryNameFormatter === 'function') name = entryNameFormatter(name, file);
    entries[name] = resolve(root, file);
  });
  return entries;
}

function discoverHtmlFiles(root, options = {}) {
  const { exclude = [], entryNameFormatter } = options;
  const validation = validateRoot(root);
  if (!validation.valid) {
    console.warn('[vite-multi-page-html-generator]', validation.error);
    return {};
  }
  const files = readDirectoryFiles(root);
  if (files.length === 0) return {};
  const htmlFiles = filterHtmlFiles(files, exclude);
  if (htmlFiles.length === 0) return {};
  return createEntryMapping(htmlFiles, root, entryNameFormatter);
}

