export function videoRange(value:string|null,size:number):{start:number;end:number}|null|'invalid'{
 if(!value)return null;
 const match=/^bytes=(\d*)-(\d*)$/.exec(value);
 if(!match||(!match[1]&&!match[2]))return 'invalid';
 const suffix=!match[1],amount=Number(match[2]);
 const start=suffix?Math.max(0,size-amount):Number(match[1]);
 const end=suffix||!match[2]?size-1:Math.min(size-1,amount);
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)return 'invalid';
 return {start,end};
}
