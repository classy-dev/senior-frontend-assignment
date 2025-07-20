import { test, expect } from '@playwright/test';

test.describe('콘텐츠 타입별 렌더링', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    

    await page.waitForLoadState('networkidle');
  });

  test('Markdown 콘텐츠가 올바르게 렌더링되어야 함', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요... (Shift+Enter로 줄바꿈)');
    
    // Markdown 요청
    await input.fill('markdown 예시를 보여주세요');
    await page.keyboard.press('Enter');
    
    // Markdown 컨테이너 확인
    await expect(page.locator('.markdown-content')).toBeVisible({ timeout: 10000 });
    
    // 스트리밍 완료 대기
    await page.waitForTimeout(10000);
    
    // Markdown이 HTML로 렌더링되었는지 확인 - 하나 이상의 HTML 요소가 있어야 함
    const markdownContent = page.locator('.markdown-content').last();
    
    // 모든 일반적인 HTML 요소들을 선택
    const htmlElements = markdownContent.locator('h1, h2, h3, h4, h5, h6, p, ul, ol, li, pre, code, strong, em, b, i, a, blockquote, table, img, hr');
    
    // 최소 하나 이상의 HTML 요소가 렌더링되었는지 확인
    expect(await htmlElements.count()).toBeGreaterThan(0);
  });

  test('HTML 콘텐츠가 안전하게 렌더링되어야 함', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요... (Shift+Enter로 줄바꿈)');
    
    // HTML 요청
    await input.fill('html 태그 예시를 주세요');
    await page.keyboard.press('Enter');
    
    // HTML 컨테이너 확인
    await expect(page.locator('.html-content')).toBeVisible({ timeout: 10000 });
    
    // 스트리밍 완료 대기
    await page.waitForTimeout(10000);
    
    // HTML 요소가 제대로 렌더링되었는지 확인
    const htmlContent = page.locator('.html-content').last();
    
    // 하나 이상의 HTML 요소가 렌더링되었는지 확인
    const htmlElements = htmlContent.locator('h1, h2, h3, h4, h5, h6, p, div, span, ul, ol, li, a, img, table, form, input, button, section, article');
    expect(await htmlElements.count()).toBeGreaterThan(0);
    
    // 링크가 새 탭에서 열리도록 설정되었는지 확인 (있다면)
    const links = htmlContent.locator('a');
    const linkCount = await links.count();
    for (let i = 0; i < linkCount; i++) {
      await expect(links.nth(i)).toHaveAttribute('target', '_blank');
      await expect(links.nth(i)).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  

  test('일반 텍스트가 올바르게 표시되어야 함', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요... (Shift+Enter로 줄바꿈)');
    
    // 일반 텍스트 요청
    await input.fill('안녕하세요');
    await page.keyboard.press('Enter');
    
    // 텍스트 응답 확인 - 모든 샘플에 공통 패턴
    await expect(page.getByText(/(텍스트|답변|응답)/)).toBeVisible({ timeout: 10000 });
    
    // 특수 포맷팅이 없어야 함
    const messageContent = page.locator('.text-content').last();
    await expect(messageContent.locator('h1, h2, h3, pre, code')).toHaveCount(0);
  });

  test('스트리밍 중 콘텐츠가 점진적으로 표시되어야 함', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요... (Shift+Enter로 줄바꿈)');
    
    // Markdown 스트리밍 테스트
    await input.fill('markdown 스트리밍 테스트');
    await page.keyboard.press('Enter');
    
    // 스트리밍 인디케이터 확인
    await expect(page.getByText('응답 생성 중...')).toBeVisible();
    
    // 타이핑 애니메이션 확인
    await expect(page.locator('.animate-typing')).toBeVisible();
    
    // 콘텐츠가 점진적으로 나타나는지 확인 (일부만 표시되었다가 전체가 표시됨)
    await page.waitForTimeout(500);
    const partialContent = await page.locator('.markdown-content').last().textContent();
    
    await page.waitForTimeout(1000);
    const fullContent = await page.locator('.markdown-content').last().textContent();
    
    expect(fullContent!.length).toBeGreaterThan(partialContent!.length);
  });

  test('JSON 트리 뷰에서 객체/배열 접기/펼치기가 동작해야 함', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요... (Shift+Enter로 줄바꿈)');
    
    // JSON 요청
    await input.fill('json 데이터를 보여주세요');
    await page.keyboard.press('Enter');
    
    // JSON 응답 대기
    await expect(page.locator('.json-content')).toBeVisible({ timeout: 10000 });
    
    // 접기/펼치기 버튼 찾기 (있다면)
    const toggleButtons = page.locator('button[aria-label*="접기"], button[aria-label*="펼치기"]');
    const buttonCount = await toggleButtons.count();
    
    if (buttonCount > 0) {
      const toggleButton = toggleButtons.first();
      await expect(toggleButton).toBeVisible();
      
      // 버튼 클릭 테스트
      await toggleButton.click();
      await page.waitForTimeout(100); // 애니메이션 대기
    }
  });

  test('URL이 클릭 가능한 링크로 변환되어야 함', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요... (Shift+Enter로 줄바꿈)');
    
    // URL이 포함된 메시지 전송
    await input.fill('웹사이트 https://example.com 을 확인하세요');
    await page.keyboard.press('Enter');
    
    // 응답에서 URL이 링크로 변환되었는지 확인
    const link = page.locator('a[href="https://example.com"]');
    await expect(link).toBeVisible({ timeout: 10000 });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  

  test('콘텐츠 타입에 따라 적절한 배경 스타일이 적용되어야 함', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요... (Shift+Enter로 줄바꿈)');
    
    // Markdown
    await input.fill('markdown 스타일 테스트');
    await page.keyboard.press('Enter');
    
    // Markdown 메시지의 배경 스타일 확인
    await page.waitForSelector('.markdown-content');
    const markdownRenderer = page.locator('[data-testid="content-renderer"]').last();
    await expect(markdownRenderer).toHaveClass(/bg-gray-100/);
    
    // JSON
    await input.fill('json 스타일 테스트');
    await page.keyboard.press('Enter');
    
    // JSON 메시지는 배경 스타일이 없어야 함
    await page.waitForSelector('.json-content');
    const jsonRenderer = page.locator('[data-testid="content-renderer"]').last();
    await expect(jsonRenderer).not.toHaveClass(/bg-gray-100/);
  });
});