import { Server as SocketIOServer, Socket } from 'socket.io';
import { auctionEngine } from './state.js';
import { sanitizeFranchisesForPublic } from './serializers.js';

export function setupSocketHandlers(io: SocketIOServer) {
  // Wire engine events to broadcast to all connected clients
  auctionEngine.registerListeners({
    onStateChange: (state) => {
      io.emit('lot_state_updated', state);
      // Also broadcast updated franchise purse and quotas
      const franchises = auctionEngine.getFranchises();
      io.emit('franchises_updated', sanitizeFranchisesForPublic(franchises));
    },
    onScarcityChange: (scarcities) => {
      io.emit('scarcity_updated', scarcities);
    },
    onSaleFinalized: (sale) => {
      io.emit('sale_finalized', sale);
      const franchises = auctionEngine.getFranchises();
      io.emit('franchises_updated', sanitizeFranchisesForPublic(franchises));
    },
    onPlayerStatusChange: (player) => {
      io.emit('player_status_updated', player);
    },
  });

  io.on('connection', (socket: Socket) => {
    // Send immediate snapshot of current state
    socket.emit('lot_state_updated', auctionEngine.getLotState());
    socket.emit('scarcity_updated', auctionEngine.checkAndBroadcastScarcity());
    socket.emit('franchises_updated', sanitizeFranchisesForPublic(auctionEngine.getFranchises()));

    // Room subscription
    socket.on('join_room', (room: string) => {
      socket.join(room);
    });

    // Real-time Bidding from franchise mobile pad
    socket.on('place_bid', (data: { franchiseId: string; amount?: number }, callback) => {
      const result = auctionEngine.placeBid(data.franchiseId, data.amount, data.franchiseId);
      if (typeof callback === 'function') {
        callback(result);
      }
    });

    // Real-time Pass from franchise mobile pad
    socket.on('pass_lot', (data: { franchiseId: string }) => {
      auctionEngine.passFranchise(data.franchiseId);
    });
  });
}
