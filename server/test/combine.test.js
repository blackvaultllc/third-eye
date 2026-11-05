const test = require("node:test");
const assert = require("node:assert/strict");
const { combineScores } = require("../dist/lib/combine");

function layer(score) {
  return { provider: "test", aiScore: score, segments: [], notes: [] };
}
const meta = { hasC2PA: false, hasContentCredentials: false, containerFormat: "mp4", durationSeconds: 3, notes: [] };
const lip = { aiScore: null, notes: [] };

test("high visual+voice scores combine to Likely AI", () => {
  const r = combineScores({ visual: layer(0.9), voice: layer(0.8), metadata: meta, lipSync: lip, demo: false });
  assert.equal(r.verdict, "likely_ai");
  assert.ok(r.aiScore >= 65);
  assert.equal(r.demo, false);
});

test("low scores combine to Likely Real", () => {
  const r = combineScores({ visual: layer(0.1), voice: layer(0.2), metadata: meta, lipSync: lip, demo: false });
  assert.equal(r.verdict, "likely_real");
  assert.ok(r.aiScore <= 35);
});

test("neutral scores are Uncertain, and a null lip-sync layer is excluded, not averaged in", () => {
  const r = combineScores({ visual: layer(0.5), voice: layer(0.5), metadata: meta, lipSync: lip, demo: true });
  assert.equal(r.verdict, "uncertain");
  assert.equal(r.aiScore, 50);
  assert.equal(r.demo, true);
  assert.ok(r.why.some((w) => w.includes("Lip-sync was not scored")));
});
