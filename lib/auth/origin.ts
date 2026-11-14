/** Public origin is configured explicitly behind the Docker reverse proxy. */
export function siteOrigin(requestUrl: string): string {
  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || requestUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Invalid public site URL");
  return url.origin;
}
