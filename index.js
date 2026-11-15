const BASE_URL = process.env.AGENTLAYER_URL || 'https://agentlayer.alwaysdata.net';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Erreur AgentLayer (${res.status})`);
    err.status = res.status;          // 402 = licence nécessaire, 403 = refusé par les règles, 401 = token invalide
    err.code = data.code || null;     // ex. 'license_required'
    throw err;
  }
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

  /**
   * Crée un agent avec son wallet.
   * @param {string} agentName
   * @param {number} maxPerTransaction plafond par achat (EUR)
   * @param {number} maxDaily plafond par jour (EUR)
   * @param {object} [options]
   * @param {string[]} [options.allowedMerchants] types de commerçants autorisés pour ses cartes :
   *   'travel', 'restaurants', 'software', 'advertising', 'office', 'groceries', 'fuel' (vide = tous)
   */
  async createWallet(agentName, maxPerTransaction, maxDaily, options = {}) {
    return request('/client/wallets/create', {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({
        agent_name: agentName, max_per_transaction: maxPerTransaction, max_daily: maxDaily,
        allowed_categories: options.allowedMerchants || []
      })
    });
  }

  /** Limite les cartes d'un agent à certains types de commerçants (tableau vide = tous). */
  async setAllowedMerchants(agentId, groups) {
    return request(`/client/wallets/${encodeURIComponent(agentId)}/categories`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ groups: groups || [] })
    });
  }

  /**
   * Au-dessus de ce montant (EUR), chaque achat de l'agent attend votre validation (null ou 0 = jamais).
   */
  async setApprovalThreshold(agentId, threshold) {
    return request(`/client/wallets/${encodeURIComponent(agentId)}/approval`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ threshold: threshold || null })
    });
  }

  /** Demandes de validation (les plus récentes d'abord). */
  async listApprovals() {
    return request('/client/approvals', { headers: this._headers() });
  }

  /** Accepte ou refuse une demande de validation. */
  async decideApproval(approvalId, approve) {
    return request(`/client/approvals/${encodeURIComponent(approvalId)}/decide`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ decision: approve ? 'approve' : 'reject' })
    });
  }

  /** Bloque immédiatement un agent : il ne peut plus payer ni obtenir de carte. */
  async blockAgent(agentId) {
    return request(`/client/wallets/${encodeURIComponent(agentId)}/block`, { method: 'POST', headers: this._headers() });
  }

  async unblockAgent(agentId) {
    return request(`/client/wallets/${encodeURIComponent(agentId)}/unblock`, { method: 'POST', headers: this._headers() });
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

  async pay(amount, description, options = {}) {
    return request('/agent/pay', {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ amount, description, approval_id: options.approvalId })
    });
  }

  /**
   * Demande une carte virtuelle à usage unique pour UN achat chez UN commerçant.
   * AgentLayer vérifie d'abord les règles de l'agent, puis renvoie une carte plafonnée au montant exact,
   * annulée après le paiement (ou au bout de 30 minutes si elle ne sert pas).
   * @param {number} amount montant total exact (EUR)
   * @param {string} merchant ex. 'Air France'
   * @param {string} [description] ex. 'Vol Paris-Nice du 12 décembre'
   * @param {object} [options]
   * @param {string} [options.approvalId] identifiant reçu quand l'achat a dû être validé par le propriétaire
   * @returns {Promise<object>} { success, card, transaction, instructions }
   *   ou, si l'achat dépasse le seuil de validation : { status: 'pending_approval', approval_id, message }
   */
  async getCard(amount, merchant, description, options = {}) {
    return request('/agent/card', {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ amount, merchant, description, approval_id: options.approvalId })
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