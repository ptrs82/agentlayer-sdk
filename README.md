# AgentLayer SDK

SDK officiel Node.js pour [AgentLayer](https://agentlayer.alwaysdata.net) — la couche financière pour agents IA : wallets avec plafonds, cartes virtuelles à usage unique, identité vérifiable on-chain.

## Installation

```bash
npm install agentlayer-sdk
```

## Usage — Intégrateurs (dashboard, gestion d'agents)

```javascript
const { AgentLayerClient } = require('agentlayer-sdk');

const client = await AgentLayerClient.login('vous@exemple.com', 'votre_mot_de_passe');

// Créer un agent : 150 € max par achat, 500 € par jour, cartes limitées aux voyages
const wallet = await client.createWallet('Agent voyages', 150, 500, { allowedMerchants: ['travel'] });

// Modifier plus tard les commerçants autorisés (tableau vide = tous)
await client.setAllowedMerchants(wallet.wallet.agent_id, ['travel', 'restaurants']);

// Au-dessus de 300 €, chaque achat attend votre accord (email avec Accepter / Refuser)
await client.setApprovalThreshold(wallet.wallet.agent_id, 300);

// Bloquer l'agent en urgence
await client.blockAgent(wallet.wallet.agent_id);

// Payer depuis le dashboard
await client.pay(wallet.wallet.agent_id, 10, 'Achat API');

// Générer un token pour que l'agent paie en autonomie
const token = await client.createAgentToken(wallet.wallet.agent_id, 'Token production');
```

## Usage — Agents IA autonomes

```javascript
const { AgentLayerAgent } = require('agentlayer-sdk');

const agent = new AgentLayerAgent('agt_live_xxxxx');

// Payer un vrai commerçant : carte à usage unique, plafonnée au montant exact
const { card } = await agent.getCard(120, 'Air France', 'Vol Paris-Nice du 12 décembre');
// card.number, card.exp_month, card.exp_year, card.cvc, card.cardholder_name, card.billing_address

// Au-dessus du seuil de validation, l'achat attend l'accord du propriétaire
const r = await agent.getCard(412, 'Hôtel Negresco', '2 nuits');
if (r.status === 'pending_approval') {
  // ... plus tard, une fois l'achat accepté, même demande avec l'identifiant de validation :
  const { card } = await agent.getCard(412, 'Hôtel Negresco', '2 nuits', { approvalId: r.approval_id });
}

// Paiement interne (débit du wallet)
await agent.pay(5, 'Appel API');

// Vérifier son solde
const balance = await agent.balance();

// Vérifier son identité (KYA)
const identity = await agent.identity();
```

## Erreurs

Les refus sont renvoyés sous forme d'exception avec `status` et `code` :

```javascript
try {
  await agent.getCard(900, 'Hôtel Negresco');
} catch (err) {
  if (err.status === 403) console.log('Refusé par les règles :', err.message);   // plafond, solde, agent bloqué
  if (err.code === 'license_required') console.log('Essai terminé : une licence est nécessaire');
}
```

Les cartes sont aujourd'hui émises en mode test (Stripe Issuing).

## Vérification publique d'identité (sans authentification)

```javascript
const { verifyDID } = require('agentlayer-sdk');

const result = await verifyDID('did:agentlayer:9920a1419ae9e6d9019e1006168ae1dd');
console.log(result.valid); // true — vérifié directement sur Base Sepolia
```

## Licence

MIT