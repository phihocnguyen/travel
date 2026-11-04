import type { ComponentProps } from "react";

// Semantic composition follows shadcn/ui Table; colors inherit this app's theme.
export function Table({className="",...props}:ComponentProps<"table">){return <table data-slot="table" className={`w-full caption-bottom text-sm ${className}`} {...props}/>;}
export function TableHeader({className="",...props}:ComponentProps<"thead">){return <thead data-slot="table-header" className={`sticky top-0 z-10 bg-[#f7f7f4] [&_tr]:border-b ${className}`} {...props}/>;}
export function TableBody({className="",...props}:ComponentProps<"tbody">){return <tbody data-slot="table-body" className={`[&_tr:last-child]:border-0 ${className}`} {...props}/>;}
export function TableRow({className="",...props}:ComponentProps<"tr">){return <tr data-slot="table-row" className={`border-b border-black/10 transition-colors hover:bg-black/[0.025] data-[state=selected]:bg-black/5 ${className}`} {...props}/>;}
export function TableHead({className="",...props}:ComponentProps<"th">){return <th data-slot="table-head" className={`h-10 whitespace-nowrap px-4 text-left align-middle text-xs font-medium text-black/50 ${className}`} {...props}/>;}
export function TableCell({className="",...props}:ComponentProps<"td">){return <td data-slot="table-cell" className={`px-4 py-3 align-middle ${className}`} {...props}/>;}
export function TableCaption({className="",...props}:ComponentProps<"caption">){return <caption className={`mt-4 text-sm text-black/50 ${className}`} {...props}/>;}
