import { resolve, relative, isAbsolute } from 'path';
import { access, readdir } from 'fs/promises';
import type { Plugin, UserConfig } from 'vite';

/**
 * Опции для vite-multi-page-html-generator plugin
 */
export interface MultiPageHtmlGeneratorOptions {
  /** Паттерны для исключения из поиска HTML файлов (поддерживает строки и RegExp) */
  exclude?: (string | RegExp)[];
  /** Функция для форматирования имён entry points из найденных HTML файлов */
  entryNameFormatter?: (name: string, file: string) => string;
  /** Корневая директория с HTML файлами */
  htmlRoot?: string;
  /** Подробное логирование */
  verbose?: boolean;
}

/**
 * Валидация результата
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Vite плагин для multi-page приложений, который автоматически находит HTML файлы
 * и генерирует entry points для процесса сборки.
 * 
 * @param options - Конфигурационные опции
 * @returns Vite plugin
 * 
 * @example
 * ```ts
 * import { defineConfig } from 'vite';
 * import viteMultiPageHtmlGeneratorPlugin from '@vitalx/vite-multi-page-html-generator-plugin';
 * 
 * export default defineConfig({
 *   plugins: [
 *     viteMultiPageHtmlGeneratorPlugin({
 *       htmlRoot: 'src/pages',
 *       exclude: ['test.html'],
 *       entryNameFormatter: (name) => name.replace(/_/g, '-'),
 *       verbose: true
 *     })
 *   ]
 * });
 * ```
 */
export default function viteMultiPageHtmlGeneratorPlugin(
  options: MultiPageHtmlGeneratorOptions = {}
): Plugin {
  const { 
    exclude = [], 
    entryNameFormatter, 
    htmlRoot,
    verbose = false 
  } = options;
  
  /**
   * Логирование с учетом verbose режима
   */
  function log(message: string): void {
    if (verbose) {
      console.log(message);
    }
  }
  
  /**
   * Получает и валидирует корневую директорию
   */
  function getRoot(config: UserConfig): string {
    const projectRoot = config.root || process.cwd();
    return validateHtmlRoot(htmlRoot, projectRoot);
  }
  
  return {
    name: 'vite-multi-page-html-generator',
    apply: 'build',
    
    async config(config: UserConfig) {
      const root = getRoot(config);
      const entries = await discoverHtmlFiles(root, { exclude, entryNameFormatter, verbose });
      
      if (!entries || Object.keys(entries).length === 0) {
        log('[vite-multi-page-html-generator] No HTML entries found');
        return {};
      }
      
      log(`[vite-multi-page-html-generator] Found ${Object.keys(entries).length} HTML entries: ${Object.keys(entries).join(', ')}`);
      
      // Сохраняем существующие rollupOptions чтобы не перезаписывать конфигурацию пользователя
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
 * @param userPath - Путь от пользователя
 * @param projectRoot - Корень проекта
 * @returns Валидированный абсолютный путь
 */
function validateHtmlRoot(
  userPath: string | undefined, 
  projectRoot: string
): string {
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

/**
 * Валидирует корневую директорию
 */
async function validateRoot(root: string): Promise<ValidationResult> {
  if (!root || typeof root !== 'string') {
    return { valid: false, error: 'Invalid root directory: ' + root };
  }
  
  try {
    await access(root);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: 'Root directory does not exist: ' + root 
    };
  }
}

/**
 * Читает файлы из директории
 */
async function readDirectoryFiles(root: string): Promise<string[]> {
  try {
    const files = await readdir(root);
    return Array.isArray(files) ? files : [];
  } catch (error) {
    console.error(
      '[vite-multi-page-html-generator] Error reading directory:', 
      (error as Error).message
    );
    return [];
  }
}

/**
 * Проверяет, исключен ли файл
 */
function isExcluded(file: string, exclude: (string | RegExp)[]): boolean {
  return exclude.some(pattern => {
    // Поддержка RegExp паттернов
    if (pattern instanceof RegExp) {
      return pattern.test(file);
    }
    // Поддержка строковых паттернов: точное совпадение с или без .html расширения
    const baseName = file.replace(/\.html$/, '');
    return file === pattern || baseName === pattern;
  });
}

/**
 * Фильтрует HTML файлы
 */
function filterHtmlFiles(
  files: string[], 
  exclude: (string | RegExp)[] = []
): string[] {
  return files.filter(file => 
    file.endsWith('.html') && 
    !file.startsWith('.') && 
    !isExcluded(file, exclude)
  );
}

/**
 * Создает маппинг entry points
 */
function createEntryMapping(
  htmlFiles: string[], 
  root: string, 
  entryNameFormatter?: (name: string, file: string) => string,
  verbose?: boolean
): Record<string, string> {
  const entries: Record<string, string> = {};
  
  htmlFiles.sort().forEach(file => {
    try {
      let name = file.replace(/\.html$/, '');
      
      if (typeof entryNameFormatter === 'function') {
        name = entryNameFormatter(name, file);
        if (typeof name !== 'string') {
          console.warn(
            `[vite-multi-page-html-generator] entryNameFormatter must return a string, got: ${typeof name} (file: ${file})`
          );
          return;
        }
      }
      
      // Защита от дубликатов
      if (entries[name]) {
        console.warn(
          `[vite-multi-page-html-generator] Duplicate entry name: ${name} (files: ${entries[name].split(/[/\\]/).pop()}, ${file})`
        );
        return;
      }
      
      entries[name] = resolve(root, file);
      
      if (verbose) {
        console.log(`   ✓ ${name} → ${file}`);
      }
    } catch (error) {
      console.error(
        `[vite-multi-page-html-generator] Error processing file ${file}:`, 
        (error as Error).message
      );
    }
  });
  
  return entries;
}

/**
 * Находит HTML файлы
 */
async function discoverHtmlFiles(
  root: string, 
  options: {
    exclude?: (string | RegExp)[];
    entryNameFormatter?: (name: string, file: string) => string;
    verbose?: boolean;
  } = {}
): Promise<Record<string, string> | null> {
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
    console.error(
      '[vite-multi-page-html-generator] Error discovering files:', 
      (error as Error).message
    );
    return null;
  }
}

