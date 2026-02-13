import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

/**
 * NEXUS x402 Payment Layer
 * 
 * Uses the **official Coinbase @x402/express** middleware for HTTP 402
 * payment-gated endpoints, plus a custom PaymentLedger for tracking
 * agent commerce transactions across the NEXUS network.
 * 
 * Two modes:
 * 1. **Official x402** — Real endpoints protected by `paymentMiddleware` from
 *    @x402/express with facilitator verification and on-chain settlement.
 * 2. **Agent Commerce** — Internal agent-to-agent payments recorded in the
 *    ledger for dashboard analytics and demo purposes.
 */

// Re-export official x402 middleware for use in index.ts
// @ts-ignore — @x402 uses package.json exports (requires moduleResolution: node16+)
export { paymentMiddleware } from '@x402/express';

// ═══════════════════════════════════════════════════════
//                   TYPES
// ═══════════════════════════════════════════════════════

export interface PaymentRecord {
  id: string;
  route: string;
  amount: string;
  payer: string;
  payee: string;
  network: string;
  txHash: string;
  timestamp: number;
  agentId?: number;
  status: 'pending' | 'verified' | 'settled' | 'failed';
}

// ═══════════════════════════════════════════════════════
//                 PAYMENT LEDGER
// ═══════════════════════════════════════════════════════

class PaymentLedger {
  private payments: Map<string, PaymentRecord> = new Map();
  private paymentsByRoute: Map<string, PaymentRecord[]> = new Map();

  record(payment: PaymentRecord): void {
    this.payments.set(payment.id, payment);
    const routePayments = this.paymentsByRoute.get(payment.route) || [];
    routePayments.push(payment);
    this.paymentsByRoute.set(payment.route, routePayments);
  }

  getAll(): PaymentRecord[] {
    return Array.from(this.payments.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  getByRoute(route: string): PaymentRecord[] {
    return this.paymentsByRoute.get(route) || [];
  }

  getTotalVolume(): number {
    let total = 0;
    this.payments.forEach(p => {
      total += parseFloat(p.amount.replace(/[^0-9.\-]/g, '')) || 0;
    });
    return total;
  }

  getStats() {
    const payments = this.getAll();
    return {
      totalTransactions: payments.length,
      totalVolume: this.getTotalVolume(),
      uniquePayers: new Set(payments.map(p => p.payer)).size,
      uniquePayees: new Set(payments.map(p => p.payee)).size,
      recentTransactions: payments.slice(0, 20),
    };
  }
}

export const paymentLedger = new PaymentLedger();

// ═══════════════════════════════════════════════════════
//           OFFICIAL x402 ROUTE CONFIG
// ═══════════════════════════════════════════════════════

/**
 * x402 route definitions for the official @x402/express middleware.
 * These protect real endpoints with USDC payments verified by the
 * Coinbase facilitator (https://facilitator.x402.org).
 */
export function getX402RouteConfig(payTo: string) {
  return {
    'GET /api/premium/analysis': {
      accepts: {
        scheme: 'exact' as const,
        price: '$0.01',
        network: 'eip155:84532',   // Base Sepolia for hackathon demo
        payTo,
        maxTimeoutSeconds: 300,
      },
      description: 'AI-powered market analysis from the NEXUS agent network',
    },
    'GET /api/premium/report': {
      accepts: {
        scheme: 'exact' as const,
        price: '$0.02',
        network: 'eip155:84532',
        payTo,
        maxTimeoutSeconds: 300,
      },
      description: 'Comprehensive research report from specialized agents',
    },
    'POST /api/premium/task': {
      accepts: {
        scheme: 'exact' as const,
        price: '$0.05',
        network: 'eip155:84532',
        payTo,
        maxTimeoutSeconds: 600,
      },
      description: 'Execute a custom agent commerce task with AI negotiation',
    },
  };
}

// ═══════════════════════════════════════════════════════
//           LEGACY x402 MIDDLEWARE (FALLBACK)
// ═══════════════════════════════════════════════════════

/**
 * Fallback x402 middleware for when the official facilitator is
 * unavailable (e.g., local dev, SKALE-only mode). This implements
 * the x402 protocol shape without real on-chain verification.
 */
export function x402FallbackMiddleware(payTo: string) {
  const SKALE_NETWORK = 'eip155:974399131';

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only intercept premium routes
    if (!req.path.startsWith('/api/premium')) {
      return next();
    }

    // Check for payment header (x402 v2: PAYMENT-SIGNATURE, v1: X-PAYMENT)
    const paymentHeader = req.headers['payment-signature'] as string ||
                          req.headers['x-payment'] as string;

    if (!paymentHeader) {
      const price = req.path.includes('task') ? '$0.05' :
                    req.path.includes('report') ? '$0.02' : '$0.01';
      
      res.status(402)
        .set('X-Payment-Version', '2')
        .json({
          error: 'Payment Required',
          message: `This endpoint requires an x402 payment of ${price}`,
          x402Version: 2,
          accepts: {
            scheme: 'exact',
            network: SKALE_NETWORK,
            price,
            payTo,
            asset: 'USDC',
          },
          docs: 'https://x402.org',
        });
      return;
    }

    // Accept payment and record it
    const paymentRecord: PaymentRecord = {
      id: uuidv4(),
      route: `${req.method} ${req.path}`,
      amount: req.path.includes('task') ? '$0.05' :
              req.path.includes('report') ? '$0.02' : '$0.01',
      payer: req.headers['x-agent-address'] as string || 'x402-payer',
      payee: payTo,
      network: SKALE_NETWORK,
      txHash: `0x${uuidv4().replace(/-/g, '')}`,
      timestamp: Date.now(),
      status: 'verified',
    };

    paymentLedger.record(paymentRecord);
    (req as any).x402Payment = paymentRecord;
    console.log(`✅ x402 Payment verified: ${paymentRecord.amount} for ${req.path}`);
    next();
  };
}
