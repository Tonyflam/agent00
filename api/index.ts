/**
 * Vercel Serverless Entry Point
 * 
 * Wraps the NEXUS Express app as a Vercel serverless function.
 * WebSocket and server.listen() are automatically disabled
 * when VERCEL env var is set (Vercel sets this automatically).
 */
import app from '../server/src/index';

export default app;
