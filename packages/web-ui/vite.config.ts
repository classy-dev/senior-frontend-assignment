/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['nock', '@mswjs/interceptors'],
    include: ['react', 'react-dom', 'openai', '@tanstack/react-query'],
    // esbuild 옵션으로 추가 최적화
    esbuildOptions: {
      target: 'es2020',
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Terser 압축 설정 추가
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 프로덕션에서 console.log 제거
        drop_debugger: true, // debugger 문 제거
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
      },
      mangle: true,
      format: {
        comments: false, // 주석 제거
      },
    },
    // 청크 크기 경고 임계값 설정
    chunkSizeWarningLimit: 1000,
    // CSS 코드 분할 설정
    cssCodeSplit: true,
    // 인라인 에셋 크기 제한 (4kb)
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // node_modules의 패키지를 기반으로 청크 분리
          if (id.includes('node_modules')) {
            // React 및 react-dom을 함께 번들링
            if (id.includes('react') && !id.includes('react-') || 
                id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-markdown') || id.includes('remark-gfm')) {
              return 'markdown-vendor';
            }
            if (id.includes('react-syntax-highlighter')) {
              return 'syntax-highlighter-vendor';
            }
            if (id.includes('openai')) {
              return 'openai-vendor';
            }
            if (id.includes('@tanstack')) {
              return 'tanstack-vendor';
            }
            if (id.includes('zustand') || id.includes('clsx') || id.includes('react-window')) {
              return 'ui-vendor';
            }
          }
        },
        // 청크 파일명 설정
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/js/${facadeModuleId}-[hash].js`;
        },
        // 엔트리 파일명 설정
        entryFileNames: 'assets/js/[name]-[hash].js',
        // 에셋 파일명 설정
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
      // 트리쉐이킹 최적화
      treeshake: {
        preset: 'recommended',
        // 패키지별로 side-effect 명시적 처리
        moduleSideEffects: (id: string) => {
          // 특정 패키지의 side-effect 보존
          if (id.includes('polyfill') || id.includes('regenerator-runtime')) {
            return true;
          }
          // node_modules 외부 파일은 side-effect 있다고 가정
          if (!id.includes('node_modules')) {
            return true;
          }
          // 나머지 외부 모듈은 side-effect 없다고 가정
          return false;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**/*', 'node_modules/**/*', 'dist/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
});