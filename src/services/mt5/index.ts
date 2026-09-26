import { MT5Connector } from './types';
import { MetaApiConnector } from './metaApiConnector';
import { MockMT5Connector } from './mockConnector';
import { EABridgeConnector } from './eaBridgeConnector';

export * from './types';
export * from './mockConnector';
export * from './metaApiConnector';
export * from './eaBridgeConnector';

export type ConnectorProvider = 'builtin' | 'metaapi' | 'ea';

/**
 * Returns the configured MT5 connector instance.
 * Automatically selects the requested connector or falls back to built-in bridge.
 */
export function getMT5Connector(typeOverride?: ConnectorProvider): MT5Connector {
  const connectorType = typeOverride || (process.env.MT5_CONNECTOR_TYPE as ConnectorProvider) || 'builtin';

  if (connectorType === 'ea') {
    return new EABridgeConnector();
  }

  if (connectorType === 'metaapi' && process.env.METAAPI_TOKEN) {
    return new MetaApiConnector();
  }

  // Default to built-in resilient bridge
  return new MockMT5Connector();
}
