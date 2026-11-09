export type CommunityVideo={id:string;title:string;description:string;authorName:string;authorSub:string;createdAt:string;status:'pending'|'approved'|'rejected';reviewNote:string|null;votes:number;voted:boolean};
export const MAX_VIDEO_BYTES=50*1024*1024;
