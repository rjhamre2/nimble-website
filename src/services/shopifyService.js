import { apiConfig } from '../config/api';

/**
 * Fetches the current Shopify connection status for the authenticated user.
 * Calls GET /api/shopify/status on the DB server.
 *
 * @returns {{ success: boolean, data: { isConnected: boolean, shopifyDomain: string|null } }}
 */
export const checkShopifyStatus = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  const url = apiConfig.endpoints.shopify.status();
  console.log('🛒 [Shopify] Checking status at:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [Shopify] Status check failed:', response.status, errorText);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ [Shopify] Status response:', data);
  return data;
};

/**
 * Saves the user's Shopify domain so the callback can link the token.
 * Calls PUT /api/users/:id with { shopify_domain }.
 *
 * @param {number} userDbId  - The integer DB primary key of the user.
 * @param {string} domain    - Cleaned myshopify.com domain.
 */
export const saveShopifyDomain = async (userDbId, domain) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('Not authenticated');

  const url = `${apiConfig.dbServerConfig.baseURL}/api/users/${userDbId}`;
  console.log('🛒 [Shopify] Saving domain to:', url, '→', domain);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ shopify_domain: domain }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [Shopify] Domain save failed:', response.status, errorText);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ [Shopify] Domain saved:', data);
  return data;
};
