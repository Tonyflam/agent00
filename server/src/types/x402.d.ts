/**
 * Type declarations for @x402 packages
 * These packages use package.json exports which require moduleResolution: "bundler" or "node16"
 * Since we use "node" moduleResolution with ts-node, we declare them here.
 */

declare module '@x402/express' {
  import { RequestHandler } from 'express';

  export interface RouteConfig {
    [path: string]: {
      price: string;
      network: string;
      config?: Record<string, any>;
    };
  }

  export class x402ResourceServer {
    constructor(facilitatorClient: any);
    register(network: string, scheme: any): this;
  }

  export function paymentMiddleware(
    routes: RouteConfig,
    resourceServer: x402ResourceServer
  ): RequestHandler;
}

declare module '@x402/core/server' {
  export class HTTPFacilitatorClient {
    constructor(config: { url: string });
  }
}

declare module '@x402/evm/exact/server' {
  export class ExactEvmScheme {
    constructor();
  }
}
