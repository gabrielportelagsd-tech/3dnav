/* Cloudflare Worker + D1 (plano gratuito) — API de lugares salvos do Rota3D
   1) npx wrangler d1 create rota3d
   2) npx wrangler d1 execute rota3d --remote --command "CREATE TABLE IF NOT EXISTS places (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, lat REAL NOT NULL, lng REAL NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)"
   3) wrangler.toml:  name="rota3d-api"  main="worker.js"  compatibility_date="2025-01-01"
                      [[d1_databases]] binding="DB" database_name="rota3d" database_id="<ID do passo 1>"
   4) npx wrangler deploy  → cole a URL em API_BASE no index.html */
const CORS = {'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,DELETE,OPTIONS','access-control-allow-headers':'content-type'};
const json = (d, s = 200) => new Response(JSON.stringify(d), {status:s, headers:{...CORS,'content-type':'application/json'}});

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, {headers:CORS});
    if (u.pathname !== '/places') return json({error:'não encontrado'}, 404);
    if (req.method === 'GET') {
      const {results} = await env.DB.prepare('SELECT id,name,lat,lng FROM places ORDER BY id DESC LIMIT 50').all();
      return json(results);
    }
    if (req.method === 'POST') {
      const b = await req.json();
      if (!b.name || isNaN(b.lat) || isNaN(b.lng)) return json({error:'dados inválidos'}, 400);
      await env.DB.prepare('INSERT INTO places (name,lat,lng) VALUES (?,?,?)').bind(String(b.name).slice(0,120), +b.lat, +b.lng).run();
      return json({ok:true}, 201);
    }
    if (req.method === 'DELETE') {
      await env.DB.prepare('DELETE FROM places WHERE id=?').bind(+u.searchParams.get('id')).run();
      return json({ok:true});
    }
    return json({error:'método não permitido'}, 405);
  }
};
