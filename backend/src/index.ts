import {Hono} from 'hono'
import {cors} from 'hono/cors'
import {D1Database} from '@cloudflare/workers-types'
import {Session} from "./session.model";
import {Member} from "./member.model";
import {Link} from "./link.model";

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

const tables = {
  sessions: 'pp_sessions',
  members: 'pp_members',
  links: 'pp_link'
}

app.use('/*', cors({
  origin: ['https://apps.arxalex.com', 'https://apps2.arxalex.com'],
  allowMethods: ['GET', 'POST']
}))

app.get('/session', async (c) => {
  const idPass = c.req.query('idpass');
  if (!idPass || idPass.length <= 6) {
    return c.json({error: 'Query not specified'}, 404)
  }
  const id = idPass.slice(0, -6);
  const pass = idPass.slice(-6);

  const query = `select *
                   from ${tables.sessions}
                   where id = ?
                     and pass = ?`;
  const result = await c.env.DB.prepare(query).bind(id, pass).run();
  return c.json(result.results[0])
})
app.get('/member', async (c) => {
  const idPass = c.req.query('idpass');
  if (!idPass || idPass.length <= 6) {
    return c.json({error: 'Query not specified'}, 404)
  }
  const id = idPass.slice(0, -6);
  const pass = idPass.slice(-6);

  const query = `select *
                   from ${tables.members}
                   where id = ?
                     and pass = ?`;
  const result = await c.env.DB.prepare(query).bind(id, pass).run();
  return c.json(result.results[0])
})
app.get('/links', async (c) => {
  const idPass = c.req.query('idpass');
  if (!idPass || idPass.length <= 6) {
    return c.json({error: 'Query not specified'}, 404)
  }
  const id = idPass.slice(0, -6);
  const pass = idPass.slice(-6);

  const query = `select *
                   from ${tables.links}
                   where id = ?
                     and pass = ?`;
  const result = await c.env.DB.prepare(query).bind(id, pass).run();
  return c.json(result.results)
})
app.post('/session', async (c) => {
  const data = await c.req.json<Session>();
  if (!data || !data.pass || data.pass.length !== 6) {
    return c.json({error: 'Query not specified'}, 404)
  }

  const query = `insert into ${tables.sessions} (pass, data) values (?, ?) RETURNING id`;
  const result = await c.env.DB.prepare(query).bind(data.pass, data.data).run();
  return c.json({
    id: result.results[0].id,
    pass: data.pass,
    response: result.success
  })
})
app.post('/member', async (c) => {
  const data = await c.req.json<Member>();
  if (!data || !data.pass || data.pass.length !== 6) {
    return c.json({error: 'Query not specified'}, 404)
  }

  const query = `insert into ${tables.members} (pass, email, phone, first_name, last_name) values (?, ?, ?, ?, ?) RETURNING id`;
  const result = await c.env.DB.prepare(query).bind(data.pass, data.email, data.phone, data.first_name, data.last_name).run();
  return c.json({
    id: result.results[0].id,
    pass: data.pass,
    response: result.success
  })
})
app.post('/link', async (c) => {
  const data = await c.req.json<Link>();
  if (!data || !data.pass || data.pass.length !== 6) {
    return c.json({error: 'Query not specified'}, 404)
  }

  const query = `insert into ${tables.links} (id, pass, memberid, name, rate) values (?, ?, ?, ?, ?) RETURNING linkid`;
  const result = await c.env.DB.prepare(query).bind(data.id, data.pass, data.memberid, data.name, data.rate).run();
  return c.json({
    id: result.results[0].linkid,
    pass: data.pass,
    response: result.success
  })
})
app.post('/session/update', async (c) => {
  const data = await c.req.json<Session>();
  if (!data || !data.id || data.id <= 0 || !data.pass || data.pass.length !== 6) {
    return c.json({error: 'Query not specified'}, 404)
  }

  const query = `update ${tables.sessions} set data = ? where id = ? and pass = ?`;
  const result = await c.env.DB.prepare(query).bind(data.data, data.id, data.pass).run();
  return c.json({
    response: result.success
  })
})
app.post('/member/update', async (c) => {
  const data = await c.req.json<Member>();
  if (!data || !data.id || data.id <= 0 || !data.pass || data.pass.length !== 6) {
    return c.json({error: 'Query not specified'}, 404)
  }

  const query = `update ${tables.members} set email = ?, phone = ?, first_name = ?, last_name = ? where id = ? and pass = ?`;
  const result = await c.env.DB.prepare(query).bind(data.email, data.phone, data.first_name, data.last_name, data.id, data.pass).run();
  return c.json({
    response: result.success
  })
})
app.post('/link/update', async (c) => {
  const data = await c.req.json<Link>();
  if (!data || !data.id || data.id <= 0 || !data.pass || data.pass.length !== 6) {
    return c.json({error: 'Query not specified'}, 404)
  }

  const query = `update ${tables.members} set memberid = ?, name = ?, rate = ? where id = ? and pass = ? and linkid = ?`;
  const result = await c.env.DB.prepare(query).bind(data.memberid, data.name, data.rate, data.id, data.pass, data.linkid).run();
  return c.json({
    response: result.success
  })
})
app.post('/link/delete', async (c) => {
  const data = await c.req.json<Link>();
  if (!data || !data.pass || data.pass.length !== 6) {
    return c.json({error: 'Query not specified'}, 404)
  }

  const query = `delete from ${tables.links} where id = ? and pass = ? and linkid = ?`;
  const result = await c.env.DB.prepare(query).bind(data.id, data.pass, data.linkid).run();
  return c.json({
    id: result.meta.lastRowId,
    pass: data.pass,
    response: result.success
  })
})

export default app