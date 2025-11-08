import { resolve, relative, isAbsolute } from 'path';
import { access, readdir } from 'fs/promises';

/**
 * Vite plugin for multi-page applications that automatically discovers HTML files
 * and generates entry points for the build process.
 * 
 * @param {Object} options - Configuration options
 * @param {(string|RegExp)[]} options.exclude - Patterns to exclude
 * @param {Function} options.entryNameFormatter - Function to format entry names
 * @param {string} options.htmlRoot - Root directory containing HTML files
 * @param {boolean} options.verbose - Enable verbose logging
 * @returns {Object} Vite plugin
 */
export default function viteMultiPageHtmlGeneratorPlugin(options = {}) {
  const { exclude = [], entryNameFormatter, htmlRoot, verbose = false } = options;
  
  /**
   * Логирование с учетом verbose режима
   */
  function log(message) {
    if (verbose) {
      console.log(message);
    }
  }
  
  function getRoot(config) {
    const projectRoot = config.root || process.cwd();
    return validateHtmlRoot(htmlRoot, projectRoot);
  }
  
  return {
    name: 'vite-multi-page-html-generator',
    apply: 'build',
    
    async config(config) {
      const root = getRoot(config);
      const entries = await discoverHtmlFiles(root, { exclude, entryNameFormatter, verbose });
      
      if (!entries || Object.keys(entries).length === 0) {
        log('[vite-multi-page-html-generator] No HTML entries found');
        return {};
      }
      
      log(`[vite-multi-page-html-generator] Found ${Object.keys(entries).length} HTML entries: ${Object.keys(entries).join(', ')}`);
      
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

/**
 * Валидация htmlRoot против path traversal атак
 * @param {string|undefined} userPath - Путь от пользователя
 * @param {string} projectRoot - Корень проекта
 * @returns {string} Валидированный абсолютный путь
 */
function validateHtmlRoot(userPath, projectRoot) {
  if (!userPath) return projectRoot;
  
  const absolutePath = resolve(projectRoot, userPath);
  const relativePath = relative(projectRoot, absolutePath);
  
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error(
      `❌ Security: htmlRoot "${userPath}" is outside project root\n\n` +
      `   Project root: ${projectRoot}\n` +
      `   Attempted path: ${absolutePath}\n\n` +
      `   ⚠️  The path points outside the project root directory.\n` +
      `   This is not allowed for security reasons (path traversal prevention).\n\n` +
      `   ✅ Valid path examples:\n` +
      `      - 'src/pages'           → relative to project root\n` +
      `      - 'public'              → relative to project root\n` +
      `      - './templates'         → explicit relative path\n\n` +
      `   ❌ Invalid path examples:\n` +
      `      - '../other-project'    → outside project (path traversal)\n` +
      `      - '../../etc'           → system directory access attempt\n` +
      `      - '/absolute/path'      → absolute paths not allowed\n\n` +
      `   💡 Tip: All paths must be inside your project directory.`
    );
  }
  
  return absolutePath;
}

async function validateRoot(root) {
  if (!root || typeof root !== 'string') {
    return { valid: false, error: 'Invalid root directory: ' + root };
  }
  
  try {
    await access(root);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Root directory does not exist: ' + root };
  }
}

async function readDirectoryFiles(root) {
  try {
    const files = await readdir(root);
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

function createEntryMapping(htmlFiles, root, entryNameFormatter, verbose = false) {
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
      
      if (verbose) {
        console.log(`   ✓ ${name} → ${file}`);
      }
    } catch (error) {
      console.error(`[vite-multi-page-html-generator] Error processing file ${file}:`, error.message);
    }
  });
  
  return entries;
}

async function discoverHtmlFiles(root, options = {}) {
  const { exclude = [], entryNameFormatter, verbose = false } = options;
  
  const validation = await validateRoot(root);
  if (!validation.valid) {
    console.warn('[vite-multi-page-html-generator]', validation.error);
    return null;
  }
  
  try {
    const files = await readDirectoryFiles(root);
    if (files.length === 0) return null;
    
    const htmlFiles = filterHtmlFiles(files, exclude);
    if (htmlFiles.length === 0) return null;
    
    if (verbose) {
      console.log(`\n[vite-multi-page-html-generator] Found ${htmlFiles.length} HTML files:`);
    }
    
    return createEntryMapping(htmlFiles, root, entryNameFormatter, verbose);
  } catch (error) {
    console.error('[vite-multi-page-html-generator] Error discovering files:', error.message);
    return null;
  }
}

