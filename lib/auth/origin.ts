/** Public origin is configured explicitly behind the Docker reverse proxy. */
export function siteOrigin(requestUrl: string): string {
  // SITE_URL is server-only and read at runtime; NEXT_PUBLIC_* may have been
  // inlined into an older Docker image during its build.
  const url = new URL(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.GOOGLE_REDIRECT_URI || requestUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Invalid public site URL");
  if(process.env.NODE_ENV==="production"&&["0.0.0.0","127.0.0.1","localhost","[::]","[::1]"].includes(url.hostname))throw new Error("Set SITE_URL to the public HTTPS domain");
  return url.origin;
}
