const BASE_URL = process.env.AGENTLAYER_URL || 'https://agentlayer.alwaysdata.net';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erreur AgentLayer (${res.status})`);
  return data;
}

/**
 * Client AgentLayer — pour les intégrateurs (dashboard, gestion d'agents)
 */
class AgentLayerClient {
  constructor(clientToken) {
    if (!clientToken) throw new Error('client_token requis');
    this.token = clientToken;
  }

  static async login(email, password) {
    const data = await request('/client/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return new AgentLayerClient(data.client_token || data.token);
  }

  _headers() {
    return { Authorization: `Bearer ${this.token}` };
  }

  async createWallet(agentName, maxPerTransaction, maxDaily) {
    return request('/client/wallets/create', {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ agent_name: agentName, max_per_transaction: maxPerTransaction, max_daily: maxDaily })
    });
  }

  async listWallets() {
    return request('/client/wallets', { headers: this._headers() });
  }

  async pay(agentId, amount, description) {
    return request('/client/pay', {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ agent_id: agentId, amount, description })
    });
  }

  async createAgentToken(agentId, name) {
    return request('/client/tokens/create', {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ agent_id: agentId, name })
    });
  }

  async listAgentTokens() {
    return request('/client/tokens', { headers: this._headers() });
  }
}

/**
 * Agent AgentLayer — pour les agents IA autonomes (paiement direct via token)
 */
class AgentLayerAgent {
  constructor(agentToken) {
    if (!agentToken) throw new Error('agent_token requis');
    this.token = agentToken;
  }

  _headers() {
    return { 'x-agent-token': this.token };
  }

  async pay(amount, description) {
    return request('/agent/pay', {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ amount, description })
    });
  }

  async balance() {
    return request('/agent/balance', { headers: this._headers() });
  }

  async identity() {
    return request('/agent/identity', { headers: this._headers() });
  }
}

/**
 * Vérification publique d'une identité on-chain — sans authentification
 */
async function verifyDID(did) {
  return request(`/api/verify/${encodeURIComponent(did)}`);
}

module.exports = { AgentLayerClient, AgentLayerAgent, verifyDID };