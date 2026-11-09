export type CommunityVideo={id:string;title:string;description:string;authorName:string;authorSub:string;createdAt:string;status:'pending'|'approved'|'rejected';reviewNote:string|null;votes:number;voted:boolean};
// Multipart uploads must stay below Vercel Functions' 4.5 MB payload limit.
export const MAX_VIDEO_MB = 4;
export const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
