const ensureSchema = async (db) => {
  await db.prepare("CREATE TABLE IF NOT EXISTS app_state (state_key TEXT PRIMARY KEY, state_value TEXT NOT NULL, updated_at INTEGER NOT NULL)").run();
};
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/state") {
      if (!env.db) return Response.json({ ok:false, error:"D1 binding db is not configured" }, { status:503 });
      try {
        await ensureSchema(env.db);
        if (request.method === "GET") {
          const { results } = await env.db.prepare("SELECT state_key, state_value, updated_at FROM app_state").all();
          const state = {};
          for (const row of results || []) state[row.state_key] = JSON.parse(row.state_value);
          return Response.json({ ok:true, state });
        }
        if (request.method === "POST") {
          const body = await request.json();
          if (!body || typeof body.key !== "string") return Response.json({ ok:false, error:"Invalid state key" }, { status:400 });
          await env.db.prepare("INSERT INTO app_state (state_key, state_value, updated_at) VALUES (?, ?, ?) ON CONFLICT(state_key) DO UPDATE SET state_value=excluded.state_value, updated_at=excluded.updated_at").bind(body.key, JSON.stringify(body.value ?? null), Date.now()).run();
          return Response.json({ ok:true });
        }
        return new Response("Method Not Allowed", {status:405});
      } catch (error) {
        return Response.json({ok:false,error:String(error?.message || error)}, {status:500});
      }
    }
    return env.ASSETS.fetch(request);
  }
};