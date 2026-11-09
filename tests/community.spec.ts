import {test,expect} from '@playwright/test';
import {normalizeInput,TicketValidationError} from '../lib/tickets/validation';
import {FIXED_TICKET,TICKET_MESSAGES} from '../lib/tickets/template';
import {videoRange} from '../lib/videos/range';

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
 const id='00000000-0000-4000-8000-000000000001';
 expect((await request.put(`/api/videos/${id}/vote`,{data:{voted:true}})).status()).toBe(401);
 expect((await request.post(`/api/videos/${id}/review`,{data:{status:'approved'}})).status()).toBe(401);
 expect((await request.get(`/api/videos/${id}/stream`)).status()).toBe(401);
});
