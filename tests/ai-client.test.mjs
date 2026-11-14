import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(
  readFileSync(new URL("../lib/ai/client.ts", import.meta.url), "utf8").replace('import "server-only";', ""),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function client(response) {
  const logs = [];
  const context = {
    exports: {}, process: { env: { AI_API_KEY: "test-secret" } }, AbortSignal,
    fetch: async () => response,
    console: { warn: (...args) => logs.push(args) },
  };
  vm.runInNewContext(source, context);
  return { ...context.exports, logs };
}

test("concurrency rejection is actionable and logs no provider secrets", async () => {
  const { completeAI, logs } = client(Response.json({ error: {
    code: "concurrent_limit_exceeded", message: "private account test-secret",
  } }, { status: 429 }));
  await assert.rejects(completeAI([]), error => error.status === 429 && /đồng thời/.test(error.message));
  assert.equal(logs[0][1].code, "concurrent_limit_exceeded");
  assert.doesNotMatch(JSON.stringify(logs), /private account|test-secret/);
});

test("non-JSON provider errors retain the safe gateway response", async () => {
  const { completeAI, logs } = client(new Response("private gateway body", { status: 502 }));
  await assert.rejects(completeAI([]), error => error.status === 502);
  assert.equal(logs[0][1].code, "unknown");
  assert.doesNotMatch(JSON.stringify(logs), /private gateway body/);
});

test("unknown provider codes are not copied to logs", async () => {
  const { completeAI, logs } = client(Response.json({ error: { code: "test-secret" } }, { status: 401 }));
  await assert.rejects(completeAI([]), error => error.status === 502);
  assert.equal(logs[0][1].code, "unknown");
});

test("successful completion returns the assistant text", async () => {
  const { completeAI } = client(Response.json({ choices: [{ message: { content: " OK " }, finish_reason: "stop" }] }));
  assert.equal(await completeAI([]), "OK");
});

function chat(result) {
  let calls = 0;
  const exports = {};
  const refusal = { text: "outside website scope" };
  const source = ts.transpileModule(
    readFileSync(new URL("../lib/chat/answer.ts", import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const dependencies = {
    "server-only": {},
    "@/lib/ai/client": { AIError: Error, completeAI: async () => { calls++; return JSON.stringify(result); } },
    "@/components/campaign/campaignData": { CAMPAIGN: {}, EVENT: {} },
    "@/components/explore/world": { STOPS: [] },
    "@/lib/campaign/ugc": { UGC_EVENT: {} },
    "./scope": { SCOPE_REFUSAL: refusal },
    "./research": { needsTravelResearch: () => false },
  };
  vm.runInNewContext(source, { exports, AbortSignal, console, require: name => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return { answer: () => exports.answerChat([{ role: "user", content: "Tạo vé ở đâu?" }], new AbortController().signal), calls: () => calls, refusal };
}

test("scope and answer require one completion", async () => {
  const instance = chat({ scope: "ALLOW", text: "Bạn vào trang tạo vé." });
  assert.equal((await instance.answer()).text, "Bạn vào trang tạo vé.");
  assert.equal(instance.calls(), 1);
});

for (const scope of ["BLOCK", undefined, "allow"]) {
  test(`scope ${scope} never exposes generated content or links`, async () => {
    const instance = chat({ scope, text: "must not be shown", links: [{ href: "/map", label: "hidden" }] });
    assert.equal(await instance.answer(), instance.refusal);
  });
}
