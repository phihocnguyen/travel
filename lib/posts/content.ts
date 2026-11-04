import "server-only";
import sanitizeHtml from "sanitize-html";

export function plainToHtml(text: string): string {
  const escaped=text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  return escaped.split(/\n{2,}/).map(paragraph=>`<p>${paragraph.replace(/\n/g,"<br>")}</p>`).join("");
}
export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html,{
    allowedTags:["p","br","h2","h3","h4","strong","b","em","i","u","s","ul","ol","li","blockquote","pre","code","a","img","table","thead","tbody","tfoot","tr","th","td","hr"],
    allowedAttributes:{a:["href","title","target","rel"],img:["src","alt","title","width","height"],p:["style"],h2:["style"],h3:["style"],h4:["style"],th:["colspan","rowspan"],td:["colspan","rowspan"]},
    allowedStyles:{"*":{"text-align":[/^(left|center|right|justify)$/]}},
    allowedSchemes:["http","https","mailto","tel"],allowedSchemesByTag:{img:["http","https"]},allowProtocolRelative:false,
    transformTags:{a:(_tag,attributes)=>({tagName:"a",attribs:{...attributes,target:"_blank",rel:"noopener noreferrer nofollow"}})},
    exclusiveFilter:frame=>frame.tag==="img"&&!/^(https?:\/\/|\/api\/posts\/images\/[0-9a-f-]{36}$)/i.test(frame.attribs.src??""),
  });
}
export function postPlainText(html: string): string {
  return sanitizeHtml(html.replace(/<\/(p|h[2-4]|li|tr)>/gi," "),{allowedTags:[],allowedAttributes:{}}).replace(/\s+/g," ").trim();
}
