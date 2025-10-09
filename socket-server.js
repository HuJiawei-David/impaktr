const { Server } = require('socket.io');

const io = new Server(3001, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  allowEIO3: true,
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000
});

console.log('Socket.IO server starting on port 3001...');

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle authentication
  socket.on('authenticate', (data) => {
    const { userId } = data;
    if (userId) {
      socket.userId = userId;
      socket.join(`user:${userId}`);
      console.log(`User ${userId} authenticated`);
    }
  });

  // Handle joining rooms
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  // Handle leaving rooms
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room: ${roomId}`);
  });

  // Handle custom events
  socket.on('notification', (data) => {
    if (socket.userId) {
      io.to(`user:${socket.userId}`).emit('notification', data);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'Reason:', reason);
  });
});

console.log('Socket.IO server ready on port 3001');


