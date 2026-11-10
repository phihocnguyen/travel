import { relativeTime } from '../lib/community/time';
import {test,expect} from '@playwright/test';
import {normalizeInput,TicketValidationError} from '../lib/tickets/validation';
import {FIXED_TICKET,TICKET_MESSAGES} from '../lib/tickets/template';
import {videoRange} from '../lib/videos/range';
import {statusInput, decodeStatusText, STATUS_MAX_LENGTH} from '../lib/posts/status';

test('community interactions reject invalid targets and require login for writes', async ({request}) => {
 const id='00000000-0000-4000-8000-000000000001';
 expect((await request.get('/api/community/unknown/'+id)).status()).toBe(404);
 expect((await request.get('/api/community/posts/invalid')).status()).toBe(404);
 for (const kind of ['posts','videos']) {
  expect((await request.post(`/api/community/${kind}/${id}`,{data:{content:'Hello'}})).status()).toBe(401);
  expect((await request.put(`/api/community/${kind}/${id}`,{data:{liked:true}})).status()).toBe(401);
 }
});

test('short statuses derive their title and keep multiline content for moderation',()=>{
 const input=statusInput('  Một buổi sáng ở Cao Lãnh\nĐi cùng bạn bè!  ');
 expect(input.title).toBe('Một buổi sáng ở Cao Lãnh');
 expect(input.content).toBe('Một buổi sáng ở Cao Lãnh\nĐi cùng bạn bè!');
 expect(input.contentFormat).toBe('plain');
 expect(()=>statusInput(' ')).toThrow();
 expect(()=>statusInput('x'.repeat(STATUS_MAX_LENGTH+1))).toThrow();
 expect(statusInput('x'.repeat(STATUS_MAX_LENGTH)).content).toHaveLength(STATUS_MAX_LENGTH);
});

test('feed text decodes entities without interpreting user content as markup',()=>{
 expect(decodeStatusText('Cao Lãnh &amp; bạn bè &#x1F96D;')).toBe('Cao Lãnh & bạn bè 🥭');
 expect(decodeStatusText('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe('<script>alert(1)</script>');
 expect(decodeStatusText('&#999999999;')).toBe('&#999999999;');
});

test('ticket keeps the official template when submitted styling is modified',()=>{
 const result=normalizeInput({to:'  Bùi Huỳnh Minh Châu  ',message:TICKET_MESSAGES[1].text,title:'Changed',from:'Changed',layout:'full',theme:{ink:'#ff0000'},stickers:[{emoji:'x'}],image:{scale:2},titleTransform:{x:20}});
 expect(result).toEqual({...FIXED_TICKET,to:'Bùi Huỳnh Minh Châu',message:TICKET_MESSAGES[1].text});
});
test('ticket requires a recipient and a preset message',()=>{
 expect(()=>normalizeInput({to:' ',message:TICKET_MESSAGES[0].text})).toThrow(TicketValidationError);
 expect(()=>normalizeInput({to:'Khách tham quan',message:'Arbitrary message'})).toThrow(TicketValidationError);
});
test('video byte ranges support closed, open and suffix requests',()=>{
 expect(videoRange(null,100)).toBeNull();
 expect(videoRange('bytes=0-9',100)).toEqual({start:0,end:9});
 expect(videoRange('bytes=20-',100)).toEqual({start:20,end:99});
 expect(videoRange('bytes=-10',100)).toEqual({start:90,end:99});
 expect(videoRange('bytes=80-200',100)).toEqual({start:80,end:99});
});
test('video byte ranges reject invalid requests',()=>{
 for(const input of ['bytes=100-','bytes=50-10','bytes=-0','bytes=-','bytes=0-1,4-5','nonsense','bytes=999999999999999999999-'])expect(videoRange(input,100)).toBe('invalid');
});
test('video APIs require authentication and development bypass is removed',async({request})=>{
 expect((await request.get('/api/auth/dev')).status()).toBe(404);
 expect((await request.get('/api/videos')).status()).toBe(401);
 expect((await request.post('/api/videos',{data:{}})).status()).toBe(401);
 expect((await request.post('/api/statuses',{data:{content:'A short status'}})).status()).toBe(401);
 const id='00000000-0000-4000-8000-000000000001';
 expect((await request.put(`/api/videos/${id}/vote`,{data:{voted:true}})).status()).toBe(401);
 expect((await request.post(`/api/videos/${id}/review`,{data:{status:'approved'}})).status()).toBe(401);
 expect((await request.get(`/api/videos/${id}/stream`)).status()).toBe(401);
});

test('streamed dashboard routes still redirect unauthenticated visitors',async({page})=>{
 for(const path of ['/dashboard/posts','/dashboard/videos','/dashboard/admin/videos']){
  await page.goto(path);
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.locator('[data-dashboard-shell]')).toHaveCount(0);
 }
});

test('community timestamps use Vietnamese relative units and handle clock skew', () => {
 const now = Date.parse('2026-11-11T12:00:00Z');
 const ago = (seconds: number) => new Date(now - seconds * 1000).toISOString();
 expect(relativeTime(ago(10), now)).toBe('Vài giây trước');
 expect(relativeTime(ago(60), now)).toBe('1 phút trước');
 expect(relativeTime(ago(300), now)).toBe('5 phút trước');
 expect(relativeTime(ago(3600), now)).toBe('1 giờ trước');
 expect(relativeTime(ago(86400), now)).toBe('1 ngày trước');
 expect(relativeTime(ago(604800), now)).toBe('1 tuần trước');
 expect(relativeTime(ago(2592000), now)).toBe('1 tháng trước');
 expect(relativeTime(ago(31536000), now)).toBe('1 năm trước');
 expect(relativeTime(ago(-30), now)).toBe('Vài giây trước');
 expect(relativeTime('invalid', now)).toBe('Không rõ thời gian');
});
