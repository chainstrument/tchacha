# Tchacha

Application de chat 1-to-1 en temps réel, construite avec Node.js.

## Fonctionnalités

- Inscription / connexion (authentification par JWT)
- Liste des conversations de l'utilisateur
- Messagerie 1-to-1 en temps réel
- Historique des messages
- Indicateur de présence (en ligne / hors ligne)
- Indicateur "en train d'écrire"

## Stack technique

**Backend**
- Node.js / Express — API REST
- Socket.IO — communication temps réel
- MongoDB / Mongoose — persistance des données
- JWT + bcrypt — authentification

**Frontend**
- React (Vite)
- Socket.IO client

## Architecture

```
tchacha/
  server/
    index.js              # point d'entrée : Express + Socket.IO
    config/
      db.js                # connexion MongoDB
    models/
      User.js
      Conversation.js
      Message.js
    routes/
      auth.js               # inscription / connexion
      conversations.js       # liste des conversations, historique
    sockets/
      chatHandlers.js        # événements temps réel
    middleware/
      auth.js                 # vérification JWT
  client/
    src/
      components/
      pages/
      hooks/
      socket.js
  .env
  package.json
```

## Modèle de données

- **User** : `username`, `email`, `passwordHash`, `createdAt`
- **Conversation** : `participants` (2 users), `createdAt`
- **Message** : `conversationId`, `senderId`, `content`, `createdAt`, `readAt`

## Flux temps réel

1. Le client se connecte à Socket.IO en passant son JWT dans le handshake
2. Le serveur vérifie le JWT et associe la socket à l'utilisateur
3. Les messages envoyés sont persistés en base puis diffusés au destinataire connecté
4. L'historique d'une conversation est chargé via l'API REST au moment de l'ouverture

## Prérequis

- Node.js (LTS)
- MongoDB (local ou distant)

## Installation

```bash
# à venir
```

## Démarrage

```bash
# à venir
```

## Statut du projet

En cours de conception — voir les issues du dépôt pour le suivi des tâches.
