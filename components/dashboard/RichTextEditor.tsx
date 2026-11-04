"use client";
import { useRef,useState } from "react";
import { EditorContent,useEditor,useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";

const ResizableImage=Image.extend({addAttributes(){return {...this.parent?.(),width:{default:null,parseHTML:element=>element.getAttribute("width"),renderHTML:attributes=>attributes.width?{width:attributes.width}:{}}};}});
function initialHtml(content:string,format?:string){if(format==="html")return content;return content.split(/\n{2,}/).map(text=>`<p>${text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>")}</p>`).join("");}
function pastedDocument(html:string){
  const document=new DOMParser().parseFromString(html,"text/html"),base=document.querySelector("base[href]")?.getAttribute("href");
  document.querySelectorAll("script,style,iframe,form,button,nav").forEach(node=>node.remove());
  document.querySelectorAll("img").forEach(image=>{
    let source=image.getAttribute("data-src")||image.getAttribute("data-original")||image.getAttribute("src");
    if(!source){source=image.getAttribute("srcset")?.split(",")[0].trim().split(/\s+/)[0]??null;}
    if(source&&base){try{source=new URL(source,base).href;}catch{}}
    if(source)image.setAttribute("src",source);else image.remove();
    for(const attribute of [...image.attributes])if(!["src","alt","title","width"].includes(attribute.name))image.removeAttribute(attribute.name);
  });
  document.querySelectorAll("figcaption").forEach(caption=>{const p=document.createElement("p");p.textContent=caption.textContent;caption.replaceWith(p);});
  document.querySelectorAll("figure").forEach(figure=>figure.replaceWith(...figure.childNodes));
  document.querySelectorAll("h1").forEach(heading=>{const h2=document.createElement("h2");h2.innerHTML=heading.innerHTML;heading.replaceWith(h2);});
  return document;
}

export default function RichTextEditor({content,format,onChange,onBusyChange}:{content:string;format?:string;onChange:(html:string,text:string)=>void;onBusyChange:(busy:boolean)=>void}){
  const input=useRef<HTMLInputElement>(null),activeUploads=useRef(0);
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  function uploadState(change:number){activeUploads.current+=change;const state=activeUploads.current>0;setBusy(state);onBusyChange(state);}
  async function upload(file:Blob):Promise<string>{
    if(!file.type.startsWith("image/"))throw new Error("Chỉ có thể chèn file ảnh.");
    const bitmap=await createImageBitmap(file),ratio=Math.min(1,2400/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));const context=canvas.getContext("2d");if(!context){bitmap.close();throw new Error("Không đọc được ảnh.");}context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Không xử lý được ảnh.")),"image/webp",0.9));
    const data=new FormData();data.set("image",blob,"blog-image.webp");const response=await fetch("/api/posts/images",{method:"POST",body:data});const result=await response.json();if(!response.ok)throw new Error(result.error??"Không tải được ảnh.");return result.image.url;
  }
  async function insertFiles(files:Blob[],position?:number){
    uploadState(1);setError("");try{const nodes=[];for(const file of files)nodes.push({type:"image",attrs:{src:await upload(file),alt:"Ảnh trong bài viết"}});if(editor){const at=Math.min(position??editor.state.selection.from,editor.state.doc.content.size);editor.chain().focus().insertContentAt(at,nodes).run();}}catch(error){setError(error instanceof Error?error.message:"Không thể chèn ảnh.");}finally{uploadState(-1);}
  }
  async function pasteEmbeddedImages(html:string,position:number){
    uploadState(1);setError("");try{const document=pastedDocument(html);for(const image of [...document.querySelectorAll("img")]){if(image.src.startsWith("data:image/")){const blob=await (await fetch(image.src)).blob();image.setAttribute("src",await upload(blob));}}editor?.chain().focus().insertContentAt(Math.min(position,editor.state.doc.content.size),document.body.innerHTML).run();}catch(error){setError(error instanceof Error?error.message:"Không thể dán ảnh.");}finally{uploadState(-1);}
  }
  const editor=useEditor({
    immediatelyRender:false,extensions:[StarterKit.configure({heading:{levels:[2,3,4]},link:{openOnClick:false,HTMLAttributes:{rel:"noopener noreferrer nofollow"}}}),ResizableImage,TableKit.configure({table:{resizable:false}}),TextAlign.configure({types:["heading","paragraph"]})],
    content:initialHtml(content,format),onUpdate:({editor})=>onChange(editor.getHTML(),editor.getText()),
    editorProps:{attributes:{class:"blog-content min-h-full p-4 outline-none",role:"textbox","aria-label":"Nội dung bài viết","aria-multiline":"true"},
      transformPastedHTML:html=>pastedDocument(html).body.innerHTML,
      handlePaste:(_view,event)=>{
        const html=event.clipboardData?.getData("text/html")??"",files=[...(event.clipboardData?.files??[])].filter(file=>file.type.startsWith("image/"));
        if(html&&/src=["']data:image\//i.test(html)){event.preventDefault();void pasteEmbeddedImages(html,editor?.state.selection.from??0);return true;}
        if(files.length&&!html){event.preventDefault();void insertFiles(files,editor?.state.selection.from);return true;}return false;
      },
      handleDrop:(view,event,moved)=>{if(moved)return false;const files=[...(event.dataTransfer?.files??[])].filter(file=>file.type.startsWith("image/"));if(!files.length)return false;event.preventDefault();void insertFiles(files,view.posAtCoords({left:event.clientX,top:event.clientY})?.pos);return true;},
    },
  });
  const state=useEditorState({editor,selector:({editor})=>({bold:editor?.isActive("bold"),italic:editor?.isActive("italic"),underline:editor?.isActive("underline"),image:editor?.isActive("image"),table:editor?.isActive("table")})});
  const button="rounded px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-35 aria-pressed:bg-zinc-100 aria-pressed:text-zinc-950";
  if(!editor)return <div className="min-h-0 flex-1 rounded-md border border-zinc-200 p-4 text-xs text-zinc-400">Đang mở trình soạn thảo…</div>;
  return <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-200 bg-white">
    <div role="toolbar" aria-label="Định dạng bài viết" className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-zinc-200 p-1.5" onMouseDown={event=>{if(event.target instanceof HTMLButtonElement)event.preventDefault();}}>
      <select aria-label="Kiểu đoạn văn" value={editor.isActive("heading",{level:2})?"h2":editor.isActive("heading",{level:3})?"h3":"p"} onChange={event=>{if(event.target.value==="p")editor.chain().focus().setParagraph().run();else editor.chain().focus().toggleHeading({level:event.target.value==="h2"?2:3}).run();}} className="h-8 rounded border border-zinc-200 bg-white px-1 text-xs"><option value="p">Đoạn văn</option><option value="h2">Tiêu đề H2</option><option value="h3">Tiêu đề H3</option></select>
      <button type="button" className={button} aria-label="In đậm" aria-pressed={state?.bold} onClick={()=>editor.chain().focus().toggleBold().run()}><strong>B</strong></button>
      <button type="button" className={button} aria-label="In nghiêng" aria-pressed={state?.italic} onClick={()=>editor.chain().focus().toggleItalic().run()}><em>I</em></button>
      <button type="button" className={button} aria-label="Gạch chân" aria-pressed={state?.underline} onClick={()=>editor.chain().focus().toggleUnderline().run()}><u>U</u></button>
      <button type="button" className={button} onClick={()=>editor.chain().focus().toggleBulletList().run()}>• Danh sách</button><button type="button" className={button} onClick={()=>editor.chain().focus().toggleOrderedList().run()}>1. Danh sách</button>
      <button type="button" className={button} onClick={()=>editor.chain().focus().toggleBlockquote().run()}>Trích dẫn</button>
      <button type="button" className={button} onClick={()=>{const value=window.prompt("Đường dẫn liên kết (https://…)",editor.getAttributes("link").href??"");if(value===null)return;if(!value){editor.chain().focus().extendMarkRange("link").unsetLink().run();return;}if(!/^https?:\/\//i.test(value)){setError("Liên kết cần bắt đầu bằng http:// hoặc https://.");return;}editor.chain().focus().extendMarkRange("link").setLink({href:value}).run();}}>Liên kết</button>
      <button type="button" className={button} disabled={busy} onClick={()=>input.current?.click()}>Chèn ảnh</button>
      <button type="button" className={button} onClick={()=>{const src=window.prompt("URL ảnh công khai (https://…)");if(src&&/^https?:\/\//i.test(src))editor.chain().focus().setImage({src,alt:"Ảnh trong bài viết"}).run();}}>Ảnh URL</button>
      <button type="button" className={button} onClick={()=>editor.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run()}>Bảng</button>
      <button type="button" className={button} onClick={()=>editor.chain().focus().undo().run()} aria-label="Hoàn tác">↶</button><button type="button" className={button} onClick={()=>editor.chain().focus().redo().run()} aria-label="Làm lại">↷</button>
      {state?.image&&<>{["25%","50%","100%"].map(width=><button type="button" key={width} className={button} onClick={()=>editor.chain().focus().updateAttributes("image",{width}).run()}>{width}</button>)}<button type="button" className={button} onClick={()=>{const alt=window.prompt("Mô tả ảnh",editor.getAttributes("image").alt??"");if(alt!==null)editor.chain().focus().updateAttributes("image",{alt}).run();}}>Mô tả ảnh</button></>}
      {state?.table&&<><button type="button" className={button} onClick={()=>editor.chain().focus().addRowAfter().run()}>+ Hàng</button><button type="button" className={button} onClick={()=>editor.chain().focus().deleteTable().run()}>Xóa bảng</button></>}
    </div>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={event=>{const files=[...(event.target.files??[])];event.target.value="";void insertFiles(files,editor.state.selection.from);}}/>
    <EditorContent editor={editor} className="min-h-0 flex-1 overflow-y-auto overscroll-contain"/>
    <div role="status" className={`shrink-0 border-t border-zinc-100 px-3 py-1.5 text-[10px] ${error?"text-red-700":"text-zinc-400"}`}>{error||(busy?"Đang lưu ảnh…":"Ctrl+V để dán văn bản hoặc ảnh · kéo thả ảnh vào bài viết")}</div>
  </div>;
}
