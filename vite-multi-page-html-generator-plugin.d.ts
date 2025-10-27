import type { Plugin } from 'vite';

export interface MultiPageHtmlGeneratorOptions {
  exclude?: string[];
  formatEntryName?: (name: string, file: string) => string;
  entryNameFormatter?: (name: string, file: string) => string;
  htmlRoot?: string;
  rootFolder?: string;
}

export default function viteMultiPageHtmlGeneratorPlugin(options?: MultiPageHtmlGeneratorOptions): Plugin;

