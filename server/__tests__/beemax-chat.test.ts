import { describe, expect, it, vi } from 'vitest';
import app from '../../index';

function environment(options: { failAI?: boolean; failWrite?: boolean } = {}) {
  const writes: unknown[][] = [];
  const prepare = vi.fn((sql: string) => {
    if (sql.includes('COUNT(*)')) return { first: async () => ({ count: 3 }) };
    return { bind: (...values: unknown[]) => ({ run: async () => {
      if (options.failWrite) throw new Error('write failed');
      writes.push(values);
    } }) };
  });
  const run = vi.fn(async () => {
    if (options.failAI) throw new Error('AI failed');
    return { response: 'Hello from BEEMAX.' };
  });
  return { DB: { prepare }, AI: { run }, writes };
}

function send(body: unknown, env: unknown, origin = 'http://localhost') {
  return app.request('/api/beemax/chat', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }, env as never);
}

describe('BEEMAX chat', () => {
  it.each([
    [' HELP ', 'Portal-OS1 commands:'],
    ['Node Status', 'Node telemetry reports 3 active nodes.'],
    ['catalog', 'The catalog contains 3 artworks.'],
    ['escrow', 'Escrow release is not connected to this command interface.'],
  ])('handles the explicit command %s without invoking AI', async (prompt, expected) => {
    const env = environment();
    const response = await send({ prompt }, env);
    expect(await response.json()).toMatchObject({ status: 'SUCCESS', type: 'SOVEREIGN_COMMAND', response: expect.stringContaining(expected) });
    expect(env.AI.run).not.toHaveBeenCalled();
    expect(env.writes).toHaveLength(0);
  });

  it('sends natural language to Workers AI and audits a hash of the interaction', async () => {
    const env = environment();
    const response = await send({ prompt: '  hello 🎨  ' }, env);
    expect(await response.json()).toEqual({ status: 'SUCCESS', type: 'AI_CONVERSATION', response: 'Hello from BEEMAX.' });
    expect(env.AI.run).toHaveBeenCalledWith('@cf/meta/llama-3.1-8b-instruct', expect.objectContaining({
      messages: expect.arrayContaining([{ role: 'user', content: 'hello 🎨' }]), stream: false,
    }));
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ prompt: 'hello 🎨', response: 'Hello from BEEMAX.' })));
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    expect(env.writes).toEqual([[expect.stringMatching(/^evt_ai_/), 'BEEMAX', hash]]);
  });

  it('uses a default greeting for an empty prompt', async () => {
    const env = environment();
    expect((await send({}, env)).status).toBe(200);
    expect(env.AI.run.mock.calls[0][1].messages[1].content).toBe('Hello BEEMAX, report system status.');
  });

  it('rejects cross-origin and invalid requests before using AI', async () => {
    const env = environment();
    expect((await send({ prompt: 'hello' }, env, 'https://other.example')).status).toBe(403);
    expect((await send({ prompt: 7 }, env)).status).toBe(400);
    expect((await send({ prompt: 'x'.repeat(2001) }, env)).status).toBe(400);
    expect(env.AI.run).not.toHaveBeenCalled();
    expect(env.DB.prepare).not.toHaveBeenCalled();
  });

  it.each([{ failAI: true }, { failWrite: true }])('reports unavailable when AI or the audit write fails', async (options) => {
    const env = environment(options);
    const response = await send({ prompt: 'hello' }, env);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: 'ERROR', message: 'BEEMAX is unavailable.' });
  });
});
