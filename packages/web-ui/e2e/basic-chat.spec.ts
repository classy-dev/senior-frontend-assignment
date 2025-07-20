import { test, expect } from '@playwright/test';

test.describe('기본 채팅 기능', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('채팅 UI가 올바르게 로드되어야 함', async ({ page }) => {
    // 헤더 확인
    await expect(page.locator('h1')).toContainText('WorkAI');
    
    // 초기 상태 메시지
    await expect(page.getByText('채팅을 시작해보세요')).toBeVisible();
    
    // 메시지 입력 필드
    await expect(page.getByPlaceholder('메시지를 입력하세요... (Shift+Enter로 줄바꿈)')).toBeVisible();
    
    // 전송 버튼
    await expect(page.getByRole('button', { name: '메시지 전송' })).toBeVisible();
  });

  test('메시지를 전송하고 응답을 받을 수 있어야 함', async ({ page }) => {
    // 메시지 입력
    const input = page.getByPlaceholder('메시지를 입력하세요... (Shift+Enter로 줄바꿈)');
    await input.fill('안녕하세요');
    
    // 전송
    await page.keyboard.press('Enter');
    
    // 사용자 메시지 확인
    await expect(page.getByText('안녕하세요').first()).toBeVisible();
    
    // AI 응답 대기 - data-message-type 속성으로 확인
    await expect(page.locator('[data-message-type="ai"]').first()).toBeVisible({ timeout: 10000 });
    
    // AI 아바타 확인
    await expect(page.locator('[data-message-type="ai"]').first().getByText('AI')).toBeVisible();
    
    // 스트리밍 완료 확인
    await expect(page.getByText('응답 생성 중...')).not.toBeVisible();
  });

  

  test('빈 메시지는 전송되지 않아야 함', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요... (Shift+Enter로 줄바꿈)');
    const sendButton = page.getByRole('button', { name: '메시지 전송' });
    
    // 빈 상태에서 전송 버튼이 비활성화되어 있어야 함
    await expect(sendButton).toBeDisabled();
    
    // 공백만 입력
    await input.fill('   ');
    
    // 여전히 비활성화 상태여야 함
    await expect(sendButton).toBeDisabled();
    
    // Enter 키로도 전송되지 않아야 함
    await page.keyboard.press('Enter');
    
    // 초기 상태 메시지가 여전히 표시되어야 함
    await expect(page.getByText('채팅을 시작해보세요')).toBeVisible();
  });

  
  test('연속으로 메시지를 전송할 수 있어야 함', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요... (Shift+Enter로 줄바꿈)');
    
    // 첫 번째 메시지
    await input.fill('첫 번째 메시지');
    await page.keyboard.press('Enter');
    
    // 두 번째 메시지
    await input.fill('두 번째 메시지');
    await page.keyboard.press('Enter');
    
    // 세 번째 메시지
    await input.fill('세 번째 메시지');
    await page.keyboard.press('Enter');
    
    // 모든 사용자 메시지가 DOM에 존재해야 함 (스크롤 위치 무관)
    const userMessages = page.locator('[data-message-type="user"]');
    await expect(userMessages).toHaveCount(3, { timeout: 15000 });
    
    // 각 메시지에 대한 AI 응답이 있어야 함
    const aiResponses = page.locator('[data-message-type="ai"]');
    await expect(aiResponses).toHaveCount(3, { timeout: 15000 });
  });

  test('메시지 문자 수가 표시되어야 함', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요... (Shift+Enter로 줄바꿈)');
    
    // 문자 입력
    await input.fill('테스트');
    
    // 문자 수 표시 확인
    await expect(page.getByText('3 자')).toBeVisible();
    
    // 더 긴 텍스트
    await input.fill('이것은 더 긴 테스트 메시지입니다');
    await expect(page.getByText('18 자')).toBeVisible();
    
    // 비우면 문자 수 표시가 사라져야 함
    await input.clear();
    await expect(page.getByText(/\d+ 자/)).not.toBeVisible();
  });


  test('사용자와 AI 메시지가 시각적으로 구분되어야 함', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요... (Shift+Enter로 줄바꿈)');
    
    // 메시지 전송
    await input.fill('사용자 메시지');
    await page.keyboard.press('Enter');
    
    // AI 응답 대기
    await expect(page.locator('[data-message-type="ai"]').first()).toBeVisible({ timeout: 10000 });
    
    // 사용자 메시지 스타일 확인
    const userMessage = page.locator('[data-message-type="user"]').first();
    await expect(userMessage.locator('.bg-chat-user')).toBeVisible();
    
    // AI 메시지 스타일 확인
    const aiMessage = page.locator('[data-message-type="ai"]').first();
    await expect(aiMessage.locator('.bg-chat-ai')).toBeVisible();
    
    // 아바타 확인
    await expect(page.locator('[data-message-type="user"]').first().getByText('U')).toBeVisible();
    await expect(page.locator('[data-message-type="ai"]').first().getByText('AI')).toBeVisible();
  });
});