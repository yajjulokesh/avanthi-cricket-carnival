import express from 'express';
import http from 'node:http';
import path from 'node:path';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { initDatabase } from './db.js';
import { seedDatabase } from './seed.js';
import { setupSocketHandlers } from './socket.js';
import { authRouter } from './routes/auth.js';
import { playersRouter } from './routes/players.js';
import { franchisesRouter } from './routes/franchises.js';
import { auctionRouter } from './routes/auction.js';

const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS for maximum client compatibility
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize DB schema & seed demo data
initDatabase();
seedDatabase();

// Setup Real-Time WebSockets
setupSocketHandlers(io);

// Mount API Routes
app.use('/api/auth', authRouter);
app.use('/api/players', playersRouter);
app.use('/api/franchises', franchisesRouter);
app.use('/api/auction', auctionRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', tournament: 'Avanthi Cricket Carnival 2026' });
});

// Serve frontend build in production
const clientDistPath = path.resolve(process.cwd(), 'dist/client');
app.use(express.static(clientDistPath));

// Fallback for SPA router
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.send(`
        <html>
          <body style="background:#0a0f1d; color:#e2e8f0; font-family:sans-serif; text-align:center; padding:50px;">
            <h1>🏏 Avanthi Cricket Carnival — Backend Server Running</h1>
            <p>API is live at <code>/api</code>. Frontend build available once <code>npm run build</code> completes.</p>
          </body>
        </html>
      `);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🏏 Avanthi Cricket Carnival Server Online on port ${PORT}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`📡 WebSocket Gateway ready for live bidding & public stream`);
  console.log(`======================================================\n`);
});
