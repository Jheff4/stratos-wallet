import { HttpResponse } from 'msw';

export interface ChaosConfig {
  latencyMin: number;
  latencyMax: number;
  errorRate: number;
  duplicateWsEvents: boolean;
  forceDisconnect: boolean;
  messageDropRate: number;
  messageReorderRate: number;
  partialResponseRate: number;
}

let config: ChaosConfig = {
  latencyMin: 0,
  latencyMax: 0,
  errorRate: 0,
  duplicateWsEvents: false,
  forceDisconnect: false,
  messageDropRate: 0,
  messageReorderRate: 0,
  partialResponseRate: 0,
};

export function getChaosConfig(): ChaosConfig {
  return { ...config };
}

export function updateChaosConfig(newConfig: Partial<ChaosConfig>) {
  config = { ...config, ...newConfig };
}

/**
 * Apply chaos to a request handler.
 *
 * Returns an HttpResponse if chaos should short-circuit the handler,
 * or null if the handler should proceed normally.
 *
 * Handlers must check the return value:
 *   const chaos = await applyChaos();
 *   if (chaos) return chaos;
 */
// Return type is `Response | null`, not `HttpResponse`: MSW's HttpResponse is
// generic over its body type (HttpResponse<BodyType>), and applyChaos returns
// several different bodies (JSON error payloads, an empty 503). `Response` is
// their honest common supertype (HttpResponse extends Response), so callers stay
// type-safe without us inventing a fake unified body type.
export async function applyChaos(): Promise<Response | null> {
  const { latencyMin, latencyMax, errorRate, messageDropRate, partialResponseRate } = config;

  // 1. Simulated network latency
  if (latencyMax > 0) {
    const delay = latencyMin + Math.random() * (latencyMax - latencyMin);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // 2. Random server error: returns a proper 500 with GraphQL-shaped body
  //    so the fetcher's res.ok check catches it and React Query surfaces an error.
  if (errorRate > 0 && Math.random() < errorRate) {
    return HttpResponse.json(
      { errors: [{ message: 'Simulated server error (chaos)' }] },
      { status: 500 },
    );
  }

  // 3. Message drop: 503 with no body (simulates backend gone)
  if (messageDropRate > 0 && Math.random() < messageDropRate) {
    return new HttpResponse(null, { status: 503 });
  }

  // 4. Partial response: 206 with a truncated / empty data payload
  if (partialResponseRate > 0 && Math.random() < partialResponseRate) {
    return HttpResponse.json(
      { data: null, errors: [{ message: 'Partial response (chaos)' }] },
      { status: 206 },
    );
  }

  return null;
}
