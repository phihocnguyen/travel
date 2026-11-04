import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { databasePool, reportFailure } from "./db-utils.mjs";

const require = createRequire(import.meta.url);
const ts = require("typescript");
// Read the existing static content; no duplicated destination copy in seed files.
async function dataModule(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const sandbox = { exports: {} };
  runInNewContext(code, sandbox, { timeout: 1000 });
  return sandbox.exports;
}
function slug(value) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
const pool = databasePool();
let client;
try {
  const { ATTRACTIONS } = await dataModule("../lib/map/attractions.ts");
  const { CAMPAIGN, EVENT } = await dataModule("../components/campaign/campaignData.ts");
  client = await pool.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(726031942)");
  for (const [id, name] of [["admin", "Quản trị viên"], ["editor", "Biên tập nội dung"], ["ticket_operator", "Nhân sự in và trao vé"], ["analyst", "Xem thống kê"], ["user", "Khách tham quan"]]) {
    await client.query("INSERT INTO roles(id,name) VALUES ($1,$2) ON CONFLICT DO NOTHING", [id,name]);
  }
  const permissions = ["users.manage", "destinations.manage", "seasons.manage", "gallery.manage", "tickets.read", "tickets.manage", "tickets.print", "tickets.collect", "campaigns.manage", "analytics.read", "audit.read"];
  for (const permission of permissions) {
    await client.query("INSERT INTO permissions(id,description) VALUES ($1,$1) ON CONFLICT DO NOTHING", [permission]);
  }
  const grants = { admin: permissions, editor: ["destinations.manage", "seasons.manage", "gallery.manage", "campaigns.manage"], ticket_operator: ["tickets.read", "tickets.print", "tickets.collect"], analyst: ["analytics.read"] };
  for (const [role, values] of Object.entries(grants)) for (const permission of values) {
    await client.query("INSERT INTO role_permissions(role_id,permission_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [role, permission]);
  }
  for (const [id,name,order] of [["mango","Mùa xoài",0],["dry","Mùa khô",1],["flood","Mùa nước nổi",2]]) {
    await client.query("INSERT INTO seasons(id,name,sort_order) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING", [id,name,order]);
  }
  for (const [id,name] of [["mango-garden","Vườn xoài"],["food","Ẩm thực"],["landscape","Cảnh quan"],["culture","Văn hóa"],["heritage","Di tích lịch sử"],["experience","Hoạt động trải nghiệm"]]) {
    await client.query("INSERT INTO destination_categories(id,name) VALUES ($1,$2) ON CONFLICT DO NOTHING", [id,name]);
  }
  for (const [id,name] of [["landscape","Cảnh quan"],["people","Con người"],["daily-life","Đời sống"],["culture","Văn hóa"],["messages","Lời nhắn"],["food","Ẩm thực"]]) {
    await client.query("INSERT INTO gallery_categories(id,name) VALUES ($1,$2) ON CONFLICT DO NOTHING", [id,name]);
  }
  await client.query("INSERT INTO campaigns(slug,name,tagline,description,status) VALUES ($1,$2,$3,$4,'published') ON CONFLICT DO NOTHING", ["vi-xoai-dan-loi",CAMPAIGN.name,CAMPAIGN.tagline,CAMPAIGN.description]);
  const campaignId = (await client.query("SELECT id FROM campaigns WHERE slug=$1", ["vi-xoai-dan-loi"])).rows[0].id;
  await client.query(`INSERT INTO events(campaign_id,slug,name,description,location_name,schedule_note,status,metadata)
    VALUES ($1,'tram-hen-cao-lanh',$2,$3,$4,$5,'published',$6) ON CONFLICT DO NOTHING`, [campaignId,EVENT.name,EVENT.description,EVENT.meta[1].value,EVENT.meta[0].value,JSON.stringify({highlights:EVENT.highlights,tagline:EVENT.tagline})]);
  await client.query(`INSERT INTO campaign_contents(campaign_id,content_key,kind,title,summary,status)
    VALUES ($1,'homepage-introduction','section',$2,$3,'published') ON CONFLICT DO NOTHING`, [campaignId,CAMPAIGN.tagline,CAMPAIGN.description]);
  let imported = 0;
  for (const attraction of ATTRACTIONS) {
    // Only insert missing destinations. Re-running seeds never overwrites CMS edits.
    const result = await client.query(`INSERT INTO destinations(slug,legacy_map_id,name,destination_type,summary,story,experience,best_time,address,locality,longitude,latitude,status,sort_order,metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'published',$2,$13)
      ON CONFLICT DO NOTHING RETURNING id`, [slug(attraction.name),attraction.id,attraction.name,attraction.type,attraction.summary,attraction.description,attraction.experience,attraction.bestTime,attraction.address,attraction.area,attraction.lon,attraction.lat,JSON.stringify({highlights:attraction.highlights,coordinate_source:"existing_overview_map",coordinate_note:"Overview marker; exact coordinates not verified"})]);
    if (!result.rows.length) continue;
    imported++;
    const destinationId = result.rows[0].id;
    const media = await client.query(`INSERT INTO media_assets(kind,storage_provider,url,mime_type,alt_text,credit,source_url)
      VALUES ('image',$1,$2,'image/jpeg',$3,$3,$4) RETURNING id`, [attraction.image.startsWith("/")?"local":"external",attraction.image,attraction.imageCaption,attraction.imageSource??null]);
    const mediaId = media.rows[0].id;
    await client.query("UPDATE destinations SET cover_media_id=$1 WHERE id=$2", [mediaId,destinationId]);
    await client.query("INSERT INTO destination_media(destination_id,media_id,caption) VALUES ($1,$2,$3)", [destinationId,mediaId,attraction.imageCaption]);
    const category = attraction.category === "Heritage" ? "heritage" : attraction.category === "Culture" ? "culture" : /xoài|mango/i.test(attraction.name) ? "mango-garden" : "landscape";
    await client.query("INSERT INTO destination_category_links(destination_id,category_id) VALUES ($1,$2)", [destinationId,category]);
    // Initially all three modes retain current destinations. Editors can now
    // control visibility, priority and distinct copy for each season.
    await client.query("INSERT INTO destination_seasons(destination_id,season_id) SELECT $1,id FROM seasons", [destinationId]);
    if (attraction.inside) {
      await client.query(`INSERT INTO destinations(slug,parent_id,name,destination_type,summary,address,locality,status)
        VALUES ($1,$2,$3,'Không gian trưng bày lịch sử – văn hóa',$4,$5,$6,'published') ON CONFLICT DO NOTHING`, [slug(attraction.inside.name),destinationId,attraction.inside.name,attraction.inside.description,attraction.address,attraction.area]);
    }
  }
  await client.query("COMMIT");
  console.log(`Seed complete: ${imported} new map destinations; roles, permissions, seasons, categories and campaign initialized.`);
} catch (error) {
  if (client) await client.query("ROLLBACK").catch(() => {});
  reportFailure("Database seed", error);
} finally { client?.release(); await pool.end(); }
