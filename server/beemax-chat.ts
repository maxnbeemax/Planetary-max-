import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings } from './types';

const chat = new Hono<{ Bindings: Bindings }>();
const requestSchema = z.object({ prompt: z.string().trim().max(2000).optional() }).strict();

chat.post('/api/beemax/chat', async (c) => {
  if (c.req.header('Origin') !== new URL(c.req.url).origin) {
    return c.json({ status: 'ERROR', message: 'A same-origin request is required.' }, 403);
  }
  let input;
  try {
    const length = Number(c.req.header('Content-Length') ?? '0');
    if (Number.isFinite(length) && length > 60000) throw new Error('Body too large');
    const body: unknown = await c.req.json();
    if (new TextEncoder().encode(JSON.stringify(body)).byteLength > 60000) throw new Error('Body too large');
    input = requestSchema.safeParse(body);
  } catch {
    return c.json({ status: 'ERROR', message: 'Invalid JSON body.' }, 400);
  }
  if (!input.success) return c.json({ status: 'ERROR', message: 'A prompt of up to 2000 characters is required.' }, 400);

  const prompt = input.data.prompt ?? '';
  const command = prompt.toLowerCase();
  try {
    let response: string;
    switch (command) {
      case 'help':
        response = 'Portal-OS1 commands: node status, catalog, escrow, or ask BEEMAX a question.';
        break;
      case 'node status': {
        const telemetry = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM node_telemetry WHERE status = 'ACTIVE'").first<{ count: number }>();
        if (!telemetry) throw new Error('Missing telemetry count');
        response = `Node telemetry reports ${telemetry.count} active nodes.`;
        break;
      }
      case 'catalog': {
        const artworks = await c.env.DB.prepare('SELECT COUNT(*) AS count FROM artworks').first<{ count: number }>();
        if (!artworks) throw new Error('Missing artwork count');
        response = `The catalog contains ${artworks.count} artworks.`;
        break;
      }
      case 'escrow':
        response = 'Escrow release is not connected to this command interface.';
        break;
      default: {
        const result = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [
            { role: 'system', content: 'You are BEEMAX, a sovereign AI cognitive architect and conversational agent operating on Portal-OS1. Respond with intelligence, edge telemetry awareness, and precision. Do not claim access to live telemetry you have not been given.' },
            { role: 'user', content: prompt || 'Hello BEEMAX, report system status.' },
          ],
          stream: false,
        });
        if (!result || typeof result.response !== 'string' || !result.response.trim()) throw new Error('Empty AI response');
        response = result.response;
        // The existing ledger stores an interaction hash rather than conversation text.
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ prompt, response })));
        const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
        await c.env.DB.prepare(
          `INSERT INTO beemax_ledger_events (id, entity_type, entity_id, action, actor_id, payload_hash)
           VALUES (?, 'ai_conversation', ?, 'AI_CONVERSATION', NULL, ?)`
        ).bind(`evt_ai_${crypto.randomUUID()}`, 'BEEMAX', hash).run();
        return c.json({ status: 'SUCCESS', type: 'AI_CONVERSATION', response });
      }
    }
    return c.json({ status: 'SUCCESS', type: 'SOVEREIGN_COMMAND', response });
  } catch (error) {
    console.error('BEEMAX chat failed:', error);
    return c.json({ status: 'ERROR', message: 'BEEMAX is unavailable.' }, 503);
  }
});

export default chat;
