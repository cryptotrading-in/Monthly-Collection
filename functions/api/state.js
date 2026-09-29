export async function onRequestGet({ env }) {
  if (!env.db) return Response.json({ ok:false, error:"D1 binding DB is not configured" }, { status:503 });
  const { results } = await env.db.prepare("SELECT state_key, state_value, updated_at FROM app_state").all();
  const state = {};
  for (const row of results || []) state[row.state_key] = JSON.parse(row.state_value);
  return Response.json({ ok:true, state });
}

export async function onRequestPost({ request, env }) {
  if (!env.db) return Response.json({ ok:false, error:"D1 binding DB is not configured" }, { status:503 });
  const body = await request.json();
  if (!body || typeof body.key !== "string") return Response.json({ ok:false, error:"Invalid state key" }, { status:400 });
  const value = JSON.stringify(body.value ?? null);
  await env.db.prepare(
    "INSERT INTO app_state (state_key, state_value, updated_at) VALUES (?, ?, ?) ON CONFLICT(state_key) DO UPDATE SET state_value=excluded.state_value, updated_at=excluded.updated_at"
  ).bind(body.key, value, Date.now()).run();
  return Response.json({ ok:true });
}