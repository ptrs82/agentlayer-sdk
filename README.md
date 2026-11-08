# AgentLayer SDK

SDK officiel Node.js pour [AgentLayer](https://agentlayer.alwaysdata.net) — la couche financière pour agents IA (wallets, paiements, identité vérifiable on-chain).

## Installation

```bash
npm install agentlayer-sdk
```

## Usage — Intégrateurs (dashboard, gestion d'agents)

```javascript
const { AgentLayerClient } = require('agentlayer-sdk');

const client = await AgentLayerClient.login('vous@exemple.com', 'votre_mot_de_passe');

// Créer un wallet pour un agent
const wallet = await client.createWallet('Mon Agent', 50, 500);

// Payer depuis le dashboard
await client.pay(wallet.wallet.agent_id, 10, 'Achat API');

// Générer un token pour que l'agent paie en autonomie
const token = await client.createAgentToken(wallet.wallet.agent_id, 'Token production');
```

## Usage — Agents IA autonomes

```javascript
const { AgentLayerAgent } = require('agentlayer-sdk');

const agent = new AgentLayerAgent('agt_live_xxxxx');

// L'agent paie directement
await agent.pay(5, 'Appel API');

// Vérifier son solde
const balance = await agent.balance();

// Vérifier son identité (KYA)
const identity = await agent.identity();
```

## Vérification publique d'identité (sans authentification)

```javascript
const { verifyDID } = require('agentlayer-sdk');

const result = await verifyDID('did:agentlayer:9920a1419ae9e6d9019e1006168ae1dd');
console.log(result.valid); // true — vérifié directement sur Base Sepolia
```

## Licence

MIT