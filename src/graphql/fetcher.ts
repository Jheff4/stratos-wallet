import { createLogger } from '@shared/logger';

const logger = createLogger({
  feature: 'graphql',
});

export async function graphqlFetch<TData, TVariables>(
  query: string,
  variables?: TVariables,
): Promise<TData> {
  const traceId = crypto.randomUUID();

  const start = performance.now();

  logger.info('GraphQL request started', {
    traceId,
    query,
    variables,
  });

  try {
    const res = await fetch('/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-trace-id': traceId,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const json = await res.json();

    if (json.errors) {
      logger.error('GraphQL request failed', {
        traceId,
        errors: json.errors,
        duration: performance.now() - start,
      });

      throw new Error(json.errors[0].message);
    }

    logger.info('GraphQL request succeeded', {
      traceId,
      duration: performance.now() - start,
    });

    return json.data;
  } catch (error) {
    logger.error('Network request failed', {
      traceId,
      duration: performance.now() - start,
      error,
    });

    throw error;
  }
}