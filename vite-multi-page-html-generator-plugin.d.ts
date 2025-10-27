import type { Plugin } from 'vite';

/**
 * Options for vite-multi-page-html-generator plugin
 */
export interface MultiPageHtmlGeneratorOptions {
  /** Patterns to exclude from HTML file discovery (supports strings and RegExp) */
  exclude?: (string | RegExp)[];
  /** Function to format entry names from discovered HTML files */
  entryNameFormatter?: (name: string, file: string) => string;
  /** Root directory containing HTML files */
  htmlRoot?: string;
}

/**
 * Vite plugin for multi-page applications that automatically discovers HTML files
 * and generates entry points for the build process.
 * 
 * @param options - Configuration options for the plugin
 * @returns Vite plugin instance
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
 *       entryNameFormatter: (name) => name.replace(/_/g, '-')
 *     })
 *   ]
 * });
 * ```
 */
export default function viteMultiPageHtmlGeneratorPlugin(options?: MultiPageHtmlGeneratorOptions): Plugin;

