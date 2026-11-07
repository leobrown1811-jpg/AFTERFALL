# AFTERFALL multiplayer foundation

This folder's server is the first backend foundation for private online sessions.

## What it currently supports
- Create a private six-character invite-code room.
- Join a room with its code.
- Up to four connected players in one room.
- Player names are temporary display names, not accounts.
- Broadcast player position updates to other members.
- Remove disconnected players and transfer room host status.

## Important: this is not live yet
The current `index.html` prototype does not connect to this server yet, and this server has not been deployed. Therefore, players cannot join one another in the game at this stage. The next development step is to connect the browser lobby/game to these socket events, then deploy this Node.js server to a hosting service.

## Run locally (developer setup)
1. Install Node.js 20 or newer.
2. In this folder run `npm install`.
3. Set `CLIENT_ORIGIN` to the exact origin serving the game (for example `http://localhost:5500`).
4. Run `npm start`.
5. The health check is available at `http://localhost:3000/health`.

For deployment, configure the host's start command as `npm start`, provide `CLIENT_ORIGIN` as an environment variable, and use the server's HTTPS/WSS address in the browser client.

## Safety and scope
Room codes are private invitations, not a full friend system. There are no accounts, direct messages, voice chat, public matchmaking, or persistent friend lists. Do not put real names, contact details, school details, or other private information in display names. Before opening public multiplayer, AFTERFALL needs stronger abuse prevention, reporting/blocking, moderation, and age-appropriate privacy controls.
