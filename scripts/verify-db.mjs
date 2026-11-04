import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { databasePool, reportFailure } from "./db-utils.mjs";

const pool = databasePool();
let client;
try {
  client = await pool.connect();
  const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
  const versions = tables.rows.filter(({ tablename }) => /version/.test(tablename));
  assert.equal(versions.length, 0, "No ticket design version table should exist");
  const counts = await client.query(`SELECT (SELECT count(*) FROM destinations) AS destinations,
    (SELECT count(*) FROM seasons) AS seasons, (SELECT count(*) FROM roles) AS roles,
    (SELECT count(*) FROM permissions) AS permissions`);
  assert.ok(Number(counts.rows[0].destinations) >= 13);
  assert.equal(Number(counts.rows[0].seasons), 3);

  // Every fixture below is rolled back: no test users, tickets or handovers remain.
  await client.query("BEGIN");
  const userId = randomUUID(), ticketId = randomUUID();
  const campaign = (await client.query("SELECT id FROM campaigns WHERE slug='vi-xoai-dan-loi'")).rows[0].id;
  const event = (await client.query("SELECT id FROM events WHERE slug='tram-hen-cao-lanh'")).rows[0].id;
  await client.query("INSERT INTO users(id,display_name) VALUES ($1,'Schema verification')", [userId]);
  await client.query("INSERT INTO tickets(id,user_id,campaign_id,layout,theme) VALUES ($1,$2,$3,'left','{}')", [ticketId,userId,campaign]);
  await client.query("UPDATE tickets SET title='Updated in place' WHERE id=$1", [ticketId]);

  async function reject(sql, parameters, expectedCode, label) {
    await client.query("SAVEPOINT constraint_test");
    let actual;
    try { await client.query(sql, parameters); } catch (error) { actual = error.code; }
    await client.query("ROLLBACK TO SAVEPOINT constraint_test");
    await client.query("RELEASE SAVEPOINT constraint_test");
    assert.equal(actual, expectedCode, label);
  }
  await reject("INSERT INTO tickets(user_id,campaign_id,layout,theme) VALUES ($1,$2,'left','{}')", [userId,campaign], "23505", "One user can only own one ticket");
  await reject("INSERT INTO tickets(campaign_id,layout,theme) VALUES ($1,'left','{}')", [campaign], "23502", "A ticket requires a user");
  await reject("INSERT INTO destinations(slug,name,latitude,longitude) VALUES ($1,'Invalid coordinate',91,105)", [randomUUID()], "23514", "Latitude must be valid");
  const destination = (await client.query("SELECT id FROM destinations LIMIT 1")).rows[0].id;
  await client.query("INSERT INTO favorite_destinations(user_id,destination_id) VALUES ($1,$2)", [userId,destination]);
  await reject("INSERT INTO favorite_destinations(user_id,destination_id) VALUES ($1,$2)", [userId,destination], "23505", "Favorites cannot be duplicated");
  await client.query("INSERT INTO ticket_print_jobs(ticket_id,event_id) VALUES ($1,$2)", [ticketId,event]);
  await reject("INSERT INTO ticket_print_jobs(ticket_id,event_id) VALUES ($1,$2)", [ticketId,event], "23505", "Only one active print job per ticket/event");
  await client.query("INSERT INTO ticket_collections(ticket_id,event_id,verified_by) VALUES ($1,$2,$3)", [ticketId,event,userId]);
  await reject("INSERT INTO ticket_collections(ticket_id,event_id,verified_by) VALUES ($1,$2,$3)", [ticketId,event,userId], "23505", "The same ticket cannot be collected twice at an event");
  await reject("INSERT INTO ticket_access_tokens(ticket_id,token_hash,scope) VALUES ($1,'plaintext-token','edit')", [ticketId], "23514", "Recovery tokens are stored as hashes");
  await reject("INSERT INTO favorite_destinations(user_id,destination_id) VALUES ($1,$2)", [randomUUID(),destination], "23503", "Foreign keys reject orphan records");
  await reject("UPDATE tickets SET title='Must remain locked' WHERE id=$1", [ticketId], "P0001", "A collected ticket cannot be edited");
  const ticketCount = await client.query("SELECT count(*) FROM tickets WHERE user_id=$1", [userId]);
  assert.equal(Number(ticketCount.rows[0].count), 1);
  await client.query("SELECT * FROM campaign_ticket_stats");
  await client.query("SELECT * FROM event_ticket_stats");
  await client.query("SELECT * FROM daily_interaction_stats");
  await client.query("ROLLBACK");
  console.log(`Schema verified: ${tables.rows.length} tables (including migration history), 3 analytics views.`);
  console.log("Seed records:", counts.rows[0]);
  console.log("Passed: one user/one ticket, required owner, coordinate validation, unique favorites, print queue deduplication, collection deduplication, token hashing, foreign keys and in-place editing. Test records rolled back.");
} catch (error) {
  if (client) await client.query("ROLLBACK").catch(() => {});
  reportFailure("Schema verification", error);
} finally { client?.release(); await pool.end(); }
