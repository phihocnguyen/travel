// HTML passed here is sanitized by the server-side posts repository.
export default function BlogBody({content,format}:{content:string;format?:"plain"|"html"}){
  if(format!=="html")return <div className="blog-content whitespace-pre-line">{content}</div>;
  return <div className="blog-content" dangerouslySetInnerHTML={{__html:content}}/>;
}
