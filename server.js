const http = require("node:http");
const { randomBytes } = require("node:crypto");
const { Server } = require("socket.io");

const PORT = Number(process.env.PORT || 3000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5500";
const MAX_PLAYERS = 4;
const rooms = new Map();
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeRoomCode() {
  let code;
  do {
    const bytes = randomBytes(6);
    code = Array.from(bytes, b => alphabet[b % alphabet.length]).join("");
  } while (rooms.has(code));
  return code;
}

function cleanName(value) {
  if (typeof value !== "string") return "Player";
  const name = value.trim().replace(/[<>]/g, "").slice(0, 18);
  return name || "Player";
}

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "AFTERFALL multiplayer", activeRooms: rooms.size }));
    return;
  }
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("AFTERFALL multiplayer server");
});

const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN.split(",").map(value => value.trim()), methods: ["GET", "POST"] },
  transports: ["websocket", "polling"]
});

function publicPlayers(room) {
  return [...room.players.values()].map(player => ({
    id: player.id,
    name: player.name,
    x: player.x,
    y: player.y,
    isHost: player.id === room.hostId
  }));
}

function leaveRoom(socket) {
  const code = socket.data.roomCode;
  if (!code) return;
  const room = rooms.get(code);
  socket.data.roomCode = null;
  if (!room) return;
  room.players.delete(socket.id);
  socket.leave(code);
  if (room.players.size === 0) {
    rooms.delete(code);
    return;
  }
  if (room.hostId === socket.id) room.hostId = room.players.keys().next().value;
  io.to(code).emit("roomUpdate", { code, players: publicPlayers(room), hostId: room.hostId });
}

io.on("connection", socket => {
  socket.on("createRoom", ({ name } = {}, reply = () => {}) => {
    leaveRoom(socket);
    const code = makeRoomCode();
    const room = { hostId: socket.id, players: new Map() };
    room.players.set(socket.id, { id: socket.id, name: cleanName(name), x: 75, y: 270 });
    rooms.set(code, room);
    socket.join(code);
    socket.data.roomCode = code;
    reply({ ok: true, code, players: publicPlayers(room), hostId: room.hostId });
  });

  socket.on("joinRoom", ({ code, name } = {}, reply = () => {}) => {
    const roomCode = typeof code === "string" ? code.trim().toUpperCase() : "";
    const room = rooms.get(roomCode);
    if (!room) return reply({ ok: false, error: "That invite code was not found. Ask the host for a new code." });
    if (room.players.size >= MAX_PLAYERS) return reply({ ok: false, error: "This lobby is full." });
    leaveRoom(socket);
    const player = { id: socket.id, name: cleanName(name), x: 75, y: 270 };
    room.players.set(socket.id, player);
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    const update = { code: roomCode, players: publicPlayers(room), hostId: room.hostId };
    reply({ ok: true, ...update });
    io.to(roomCode).emit("roomUpdate", update);
  });

  socket.on("playerMove", ({ x, y } = {}) => {
    const code = socket.data.roomCode;
    const room = code && rooms.get(code);
    const player = room && room.players.get(socket.id);
    if (!player || !Number.isFinite(x) || !Number.isFinite(y)) return;
    player.x = Math.max(12, Math.min(888, x));
    player.y = Math.max(12, Math.min(548, y));
    socket.to(code).emit("playerMoved", { id: socket.id, x: player.x, y: player.y });
  });

  socket.on("leaveRoom", () => leaveRoom(socket));
  socket.on("disconnect", () => leaveRoom(socket));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`AFTERFALL multiplayer server listening on port ${PORT}`);
});
