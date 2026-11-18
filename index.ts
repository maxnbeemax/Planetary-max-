// Canonical Hono router; src/worker.ts exports this application.
import app from './server/planetary-max';
import nativeSettlement from './server/native-settlement';
import marketplace from './server/marketplace';
import beemaxChat from './server/beemax-chat';

export type { Bindings as Env } from './server/types';

app.route('/', nativeSettlement);
app.route('/', marketplace);
app.route('/', beemaxChat);

export { NodeRegistryDO, BEEMAXSecureNodeRegistryDO } from './server/planetary-max';
export default app;
