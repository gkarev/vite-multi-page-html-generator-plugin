import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolve } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import viteMultiPageHtmlGeneratorPlugin from '../vite-multi-page-html-generator-plugin.js';

describe('vite-multi-page-html-generator-plugin', () => {
  let testDir;
  let plugin;

  beforeEach(async () => {
    // Создаём временную директорию для тестов
    testDir = resolve(tmpdir(), `vite-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Очищаем временную директорию
    await rm(testDir, { recursive: true, force: true });
  });

  describe('Инициализация плагина', () => {
    it('должен создавать плагин с дефолтными опциями', () => {
      plugin = viteMultiPageHtmlGeneratorPlugin();
      expect(plugin.name).toBe('vite-multi-page-html-generator');
      expect(plugin.apply).toBe('build');
      expect(plugin.config).toBeDefined();
    });

    it('должен принимать кастомные опции', () => {
      plugin = viteMultiPageHtmlGeneratorPlugin({
        htmlRoot: 'src/pages',
        exclude: ['404.html'],
        entryNameFormatter: (name) => name.toUpperCase()
      });
      expect(plugin.name).toBe('vite-multi-page-html-generator');
    });
  });

  describe('Валидация htmlRoot (path traversal защита)', () => {
    it('должен блокировать path traversal атаки', async () => {
      plugin = viteMultiPageHtmlGeneratorPlugin({
        htmlRoot: '../../../etc'
      });

      const mockConfig = {
        root: testDir
      };

      await expect(plugin.config(mockConfig)).rejects.toThrow(/Security.*outside project root/);
    });

    it('должен разрешать относительные пути внутри проекта', async () => {
      await mkdir(resolve(testDir, 'src/pages'), { recursive: true });
      await writeFile(resolve(testDir, 'src/pages/index.html'), '<html></html>');

      plugin = viteMultiPageHtmlGeneratorPlugin({
        htmlRoot: 'src/pages'
      });

      const mockConfig = {
        root: testDir
      };

      const result = await plugin.config(mockConfig);
      expect(result).toBeDefined();
      expect(result.build?.rollupOptions?.input).toBeDefined();
    });

    it('должен использовать корень проекта если htmlRoot не указан', async () => {
      await writeFile(resolve(testDir, 'index.html'), '<html></html>');

      plugin = viteMultiPageHtmlGeneratorPlugin();

      const mockConfig = {
        root: testDir
      };

      const result = await plugin.config(mockConfig);
      expect(result.build?.rollupOptions?.input).toHaveProperty('index');
    });

    it('должен блокировать абсолютные пути', async () => {
      plugin = viteMultiPageHtmlGeneratorPlugin({
        htmlRoot: '/etc/passwd'
      });

      const mockConfig = {
        root: testDir
      };

      await expect(plugin.config(mockConfig)).rejects.toThrow(/Security.*outside project root/);
    });
  });

  describe('Обнаружение HTML файлов', () => {
    it('должен находить все HTML файлы в корне', async () => {
      await writeFile(resolve(testDir, 'index.html'), '<html></html>');
      await writeFile(resolve(testDir, 'about.html'), '<html></html>');
      await writeFile(resolve(testDir, 'contact.html'), '<html></html>');

      plugin = viteMultiPageHtmlGeneratorPlugin();

      const mockConfig = {
        root: testDir
      };

      const result = await plugin.config(mockConfig);
      const entries = result.build?.rollupOptions?.input;

      expect(entries).toHaveProperty('index');
      expect(entries).toHaveProperty('about');
      expect(entries).toHaveProperty('contact');
      expect(Object.keys(entries)).toHaveLength(3);
    });

    it('должен игнорировать скрытые файлы', async () => {
      await writeFile(resolve(testDir, 'index.html'), '<html></html>');
      await writeFile(resolve(testDir, '.hidden.html'), '<html></html>');

      plugin = viteMultiPageHtmlGeneratorPlugin();

      const mockConfig = {
        root: testDir
      };

      const result = await plugin.config(mockConfig);
      const entries = result.build?.rollupOptions?.input;

      expect(entries).toHaveProperty('index');
      expect(entries).not.toHaveProperty('.hidden');
      expect(entries).not.toHaveProperty('hidden');
    });

    it('должен возвращать пустой объект если HTML файлы не найдены', async () => {
      plugin = viteMultiPageHtmlGeneratorPlugin();

      const mockConfig = {
        root: testDir
      };

      const result = await plugin.config(mockConfig);

      expect(result).toEqual({});
    });
  });

  describe('Опция exclude', () => {
    it('должен исключать файлы по строковому имени', async () => {
      await writeFile(resolve(testDir, 'index.html'), '<html></html>');
      await writeFile(resolve(testDir, '404.html'), '<html></html>');
      await writeFile(resolve(testDir, 'about.html'), '<html></html>');

      plugin = viteMultiPageHtmlGeneratorPlugin({
        exclude: ['404.html']
      });

      const mockConfig = {
        root: testDir
      };

      const result = await plugin.config(mockConfig);
      const entries = result.build?.rollupOptions?.input;

      expect(entries).toHaveProperty('index');
      expect(entries).toHaveProperty('about');
      expect(entries).not.toHaveProperty('404');
    });

    it('должен исключать файлы по имени без расширения', async () => {
      await writeFile(resolve(testDir, 'index.html'), '<html></html>');
      await writeFile(resolve(testDir, 'test.html'), '<html></html>');

      plugin = viteMultiPageHtmlGeneratorPlugin({
        exclude: ['test']  // Без .html
      });

      const mockConfig = {
        root: testDir
      };

      const result = await plugin.config(mockConfig);
      const entries = result.build?.rollupOptions?.input;

      expect(entries).toHaveProperty('index');
      expect(entries).not.toHaveProperty('test');
    });

    it('должен исключать файлы по RegExp паттерну', async () => {
      await writeFile(resolve(testDir, 'index.html'), '<html></html>');
      await writeFile(resolve(testDir, 'test-page.html'), '<html></html>');
      await writeFile(resolve(testDir, 'test-admin.html'), '<html></html>');
      await writeFile(resolve(testDir, 'about.html'), '<html></html>');

      plugin = viteMultiPageHtmlGeneratorPlugin({
        exclude: [/^test-/]  // Все файлы начинающиеся с test-
      });

      const mockConfig = {
        root: testDir
      };

      const result = await plugin.config(mockConfig);
      const entries = result.build?.rollupOptions?.input;

      expect(entries).toHaveProperty('index');
      expect(entries).toHaveProperty('about');
      expect(entries).not.toHaveProperty('test-page');
      expect(entries).not.toHaveProperty('test-admin');
    });

    it('должен поддерживать множественные exclude правила', async () => {
      await writeFile(resolve(testDir, 'index.html'), '<html></html>');
      await writeFile(resolve(testDir, '404.html'), '<html></html>');
      await writeFile(resolve(testDir, 'template.html'), '<html></html>');
      await writeFile(resolve(testDir, 'test-page.html'), '<html></html>');
      await writeFile(resolve(testDir, 'about.html'), '<html></html>');

      plugin = viteMultiPageHtmlGeneratorPlugin({
        exclude: ['404', 'template.html', /^test-/]
      });

      const mockConfig = {
        root: testDir
      };

      const result = await plugin.config(mockConfig);
      const entries = result.build?.rollupOptions?.input;

      expect(entries).toHaveProperty('index');
      expect(entries).toHaveProperty('about');
      expect(entries).not.toHaveProperty('404');
      expect(entries).not.toHaveProperty('template');
      expect(entries).not.toHaveProperty('test-page');
      expect(Object.keys(entries)).toHaveLength(2);
    });
  });

  describe('entryNameFormatter опция', () => {
    it('должен форматировать имена entry points', async () => {
      await writeFile(resolve(testDir, 'home_page.html'), '<html></html>');
      await writeFile(resolve(testDir, 'about_us.html'), '<html></html>');

      plugin = viteMultiPageHtmlGeneratorPlugin({
        entryNameFormatter: (name) => name.replace(/_/g, '-')
      });

      const mockConfig = {
        root: testDir
      };

      const result = await plugin.config(mockConfig);
      const entries = result.build?.rollupOptions?.input;

      expect(entries).toHaveProperty('home-page');
      expect(entries).toHaveProperty('about-us');
    });

    it('должен пропускать файлы если formatter возвращает не строку', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

      await writeFile(resolve(testDir, 'index.html'), '<html></html>');
      await writeFile(resolve(testDir, 'about.html'), '<html></html>');

      plugin = viteMultiPageHtmlGeneratorPlugin({
        entryNameFormatter: (name) => {
          if (name === 'about') return null;  // Не строка
          return name;
        }
      });

      const mockConfig = {
        root: testDir
      };

      const result = await plugin.config(mockConfig);
      const entries = result.build?.rollupOptions?.input;

      expect(entries).toHaveProperty('index');
      expect(entries).not.toHaveProperty('about');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('must return a string'));

      consoleSpy.mockRestore();
    });
  });

  describe('Защита от дубликатов', () => {
    it('должен предотвращать дублирующиеся entry names', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

      await writeFile(resolve(testDir, 'page.html'), '<html></html>');

      plugin = viteMultiPageHtmlGeneratorPlugin({
        entryNameFormatter: (name) => 'same-name'  // Всегда возвращает одно имя
      });

      const mockConfig = {
        root: testDir
      };

      // Создаём ещё файлы вручную
      await writeFile(resolve(testDir, 'other.html'), '<html></html>');

      const result = await plugin.config(mockConfig);
      const entries = result.build?.rollupOptions?.input;

      // Должен быть только первый файл
      expect(Object.keys(entries)).toHaveLength(1);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Duplicate entry name'));

      consoleSpy.mockRestore();
    });
  });

  describe('Сохранение существующих rollupOptions', () => {
    it('должен сохранять существующие rollupOptions', async () => {
      await writeFile(resolve(testDir, 'index.html'), '<html></html>');

      plugin = viteMultiPageHtmlGeneratorPlugin();

      const mockConfig = {
        root: testDir,
        build: {
          rollupOptions: {
            output: {
              manualChunks: {
                vendor: ['vite']
              }
            }
          }
        }
      };

      const result = await plugin.config(mockConfig);

      expect(result.build.rollupOptions.input).toBeDefined();
      expect(result.build.rollupOptions.output).toEqual({
        manualChunks: {
          vendor: ['vite']
        }
      });
    });
  });

  describe('Логирование', () => {
    it('должен логировать количество найденных файлов', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await writeFile(resolve(testDir, 'index.html'), '<html></html>');
      await writeFile(resolve(testDir, 'about.html'), '<html></html>');

      plugin = viteMultiPageHtmlGeneratorPlugin();

      const mockConfig = {
        root: testDir
      };

      await plugin.config(mockConfig);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Found 2 HTML entries'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('index, about'));

      consoleSpy.mockRestore();
    });

    it('должен логировать отсутствие HTML файлов', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      plugin = viteMultiPageHtmlGeneratorPlugin();

      const mockConfig = {
        root: testDir
      };

      await plugin.config(mockConfig);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No HTML entries found'));

      consoleSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    it('должен обрабатывать отсутствие директории', async () => {
      plugin = viteMultiPageHtmlGeneratorPlugin({
        htmlRoot: 'non-existent-dir'
      });

      const mockConfig = {
        root: testDir
      };

      const result = await plugin.config(mockConfig);

      expect(result).toEqual({});
    });

    it('должен работать с process.cwd() когда root не указан', async () => {
      plugin = viteMultiPageHtmlGeneratorPlugin();

      const mockConfig = {};

      // Не должно выбросить ошибку
      await expect(plugin.config(mockConfig)).resolves.toBeDefined();
    });
  });

  describe('apply опция', () => {
    it('должен применяться только в режиме build', () => {
      plugin = viteMultiPageHtmlGeneratorPlugin();

      expect(plugin.apply).toBe('build');
    });
  });
});

