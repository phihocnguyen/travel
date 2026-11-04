import "server-only";
import type { BlogPost } from "./types";
import { postPlainText } from "./content";

export function readingMinutes(content:string){return Math.max(1,Math.ceil(postPlainText(content).split(/\s+/).filter(Boolean).length/220));}
export function postDate(post:BlogPost){return new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(post.reviewedAt??post.createdAt));}
export function postDescription(post:BlogPost){return post.excerpt||postPlainText(post.content).slice(0,220);}
export function foldSearch(value:string){return value.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d");}
export function articleHeadings(content:string){
  const headings:{id:string;title:string;level:number}[]=[];
  const html=content.replace(/<(h[23])(\s[^>]*)?>([\s\S]*?)<\/\1>/gi,(_match,tag:string,attrs:string|undefined,body:string)=>{
    const title=postPlainText(body).replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'");
    const id=`muc-${headings.length+1}-${foldSearch(title).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)}`;
    headings.push({id,title,level:Number(tag[1])});
    return `<${tag}${(attrs??"").replace(/\s+id=("[^"]*"|'[^']*')/g,"")} id="${id}">${body}</${tag}>`;
  });return {html,headings};
}
