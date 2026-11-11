import { expect, test } from '@playwright/test';
import { CHAT_TOPICS, mockChatAnswer } from '../lib/chat/mock';

test('mock chatbot supports the four suggested topics', () => {
  expect(CHAT_TOPICS.map(topic => mockChatAnswer(topic).links?.[0].href)).toEqual([
    '/map', '/map', '/dashboard/tickets/new', '/dashboard/videos?compose=1',
  ]);
  expect(mockChatAnswer(CHAT_TOPICS[2]).text).toContain('17/11/2026');
});

test('mock chatbot understands Vietnamese itinerary and ticket requests', () => {
  expect(mockChatAnswer('Gợi ý lịch trình về Cao Lãnh 2 ngày 1 đêm').text).toContain('NGÀY 2');
  expect(mockChatAnswer('lich trinh 1 ngay').text).toContain('08:00');
  expect(mockChatAnswer('Tạo vé ở đâu?').links?.[0].href).toBe('/dashboard/tickets/new');
  expect(mockChatAnswer('Vé còn không?').links?.[0].href).toBe('/dashboard/tickets/new');
  expect(mockChatAnswer('Bầu trời màu gì?').text).toContain('bốn chủ đề');
});

test('chatbot launcher appears on the homepage but not the login page', async ({ request }) => {
  expect(await (await request.get('/')).text()).toContain('data-travel-chatbot');
  expect(await (await request.get('/login')).text()).not.toContain('data-travel-chatbot');
});
