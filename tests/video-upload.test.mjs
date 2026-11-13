import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import ts from "typescript";

// Execute the real route/store modules with only session and DB connection injected.
// No production credentials, session cookies or production DB are used.
function routes(database, state) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const modules = new Map();
  const sessionFile = path.join(root, "lib/auth/session.ts");
  const dbFile = path.join(root, "lib/db.ts");
  function load(filename) {
    if (filename === sessionFile) return { getSession: async () => state.session, isAdmin: session => session?.role === "admin" };
    if (filename === dbFile) return { getDatabase: () => database };
    if (modules.has(filename)) return modules.get(filename).exports;
    const loadedModule = { exports: {} };
    modules.set(filename, loadedModule);
    const code = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const require = specifier => {
      if (specifier === "server-only") return {};
      if (specifier.startsWith("@/")) return load(path.join(root, `${specifier.slice(2)}.ts`));
      if (specifier.startsWith(".")) return load(path.resolve(path.dirname(filename), `${specifier}.ts`));
      return createRequire(filename)(specifier);
    };
    new Function("require", "module", "exports", code)(require, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return {
    upload: load(path.join(root, "app/api/videos/route.ts")),
    stream: load(path.join(root, "app/api/videos/[id]/stream/route.ts")),
  };
}

test("video upload and byte-range streaming use the real handlers and a temporary DB", async t => {
  const db = new PGlite();
  const state = { session: null };
  const { upload, stream } = routes(db, state);
  // Header fixture exercises upload storage, not video codec/playability validation.
  const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypisom"), Buffer.alloc(32, 1)]);
  const owner = { sub: "test:video-owner", name: "Video test", email: "video-test@example.invalid", provider: "google", exp: 9999999999 };
  let id;
  function request({ bytes = mp4, mime = "video/mp4", title = "Upload test", withFile = true } = {}) {
    const form = new FormData();
    form.set("title", title);
    form.set("description", "Temporary database only");
    if (withFile) form.set("video", new File([bytes], "test.mp4", { type: mime }));
    return new Request("http://localhost/api/videos", { method: "POST", body: form });
  }
  async function getStream(range) {
    return stream.GET(new Request(`http://localhost/api/videos/${id}/stream`, {
      headers: range ? { Range: range } : {},
    }), { params: Promise.resolve({ id }) });
  }
  try {
    // Use original schema migrations, including the sample-video URL source constraint.
    for (const file of ["001_initial_schema.sql", "007_community_videos.sql", "008_video_samples.sql"]) {
      await db.exec(await readFile(new URL(`../db/migrations/${file}`, import.meta.url), "utf8"));
    }
    await t.test("anonymous uploads return 401", async () => {
      assert.equal((await upload.POST(request())).status, 401);
    });
    state.session = owner;
    await t.test("authenticated multipart upload returns 201 and persists original bytes", async () => {
      const response = await upload.POST(request());
      assert.equal(response.status, 201);
      id = (await response.json()).id;
      assert.match(id, /^[0-9a-f-]{36}$/);
      const row = (await db.query("SELECT * FROM community_videos WHERE id=$1", [id])).rows[0];
      assert.equal(row.status, "pending");
      assert.equal(row.content_type, "video/mp4");
      assert.equal(row.video_url, null);
      assert.deepEqual(Buffer.from(row.video_data), mp4);
    });
    await t.test("missing file, fake MP4, unsupported MIME and oversized uploads are rejected", async () => {
      for (const options of [
        { withFile: false }, { title: "" }, { bytes: Buffer.from("not a real mp4") },
        { mime: "image/png" }, { bytes: Buffer.alloc(4 * 1024 * 1024 + 1) },
      ]) assert.equal((await upload.POST(request(options))).status, 400);
      const tooLarge = new Request("http://localhost/api/videos", {
        method: "POST", headers: { "content-length": String(5 * 1024 * 1024) }, body: "",
      });
      assert.equal((await upload.POST(tooLarge)).status, 413);
    });
    await t.test("WebM uploads are accepted", async () => {
      const response = await upload.POST(request({ bytes: Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3]), mime: "video/webm" }));
      assert.equal(response.status, 201);
    });
    await t.test("owner can read pending video and byte ranges match the uploaded file", async () => {
      const full = await getStream();
      assert.equal(full.status, 200);
      assert.deepEqual(Buffer.from(await full.arrayBuffer()), mp4);
      for (const [range, start, end] of [["bytes=0-9", 0, 9], ["bytes=20-", 20, mp4.length - 1], ["bytes=-5", mp4.length - 5, mp4.length - 1]]) {
        const response = await getStream(range);
        assert.equal(response.status, 206);
        assert.equal(response.headers.get("content-range"), `bytes ${start}-${end}/${mp4.length}`);
        assert.deepEqual(Buffer.from(await response.arrayBuffer()), mp4.subarray(start, end + 1));
      }
      assert.equal((await getStream("bytes=999999-")).status, 416);
    });
    await t.test("another user cannot stream pending video, but can stream approved video", async () => {
      state.session = { ...owner, sub: "test:another-user" };
      assert.equal((await getStream()).status, 404);
      state.session = { ...state.session, role: "admin" };
      assert.equal((await getStream()).status, 200);
      state.session = { ...owner, sub: "test:another-user" };
      await db.query("UPDATE community_videos SET status='approved' WHERE id=$1", [id]);
      assert.equal((await getStream()).status, 200);
      state.session = null;
      assert.equal((await getStream()).status, 401);
    });
  } finally {
    await db.close();
  }
});
