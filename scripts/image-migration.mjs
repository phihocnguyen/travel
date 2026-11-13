import { readImage, writeImage } from "../lib/storage/disk.mjs";

export const IMAGE_TABLES = [
  ["ticket_images", "ticket_id", "ticket-images"],
  ["ticket_outputs", "ticket_id", "ticket-outputs"],
  ["blog_covers", "post_id", "blog-covers"],
  ["blog_images", "id", "blog-images"],
];

export async function migrateImages(client, report = console.log) {
  for (const [table, column, group] of IMAGE_TABLES) {
    let migrated = 0;
    for (;;) {
      await client.query("BEGIN");
      try {
        // One bounded blob at a time; do not clear DB bytes until disk is verified.
        const row = (await client.query(`SELECT ${column} AS id, image_data FROM ${table}
          WHERE image_data IS NOT NULL LIMIT 1 FOR UPDATE`)).rows[0];
        if (!row) { await client.query("COMMIT"); break; }
        const bytes = Buffer.from(row.image_data);
        const key = await writeImage(group, bytes);
        const copy = await readImage(key);
        if (!copy?.equals(bytes)) throw new Error("Image disk verification failed");
        await client.query(`UPDATE ${table} SET file_path=$2,image_data=NULL WHERE ${column}=$1`, [row.id, key]);
        await client.query("COMMIT");
        migrated++;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      }
    }
    report(`${table}: migrated ${migrated} images to disk.`);
  }
}
