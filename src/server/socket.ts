import { Server as SocketIOServer, Socket } from 'socket.io';
import { auctionEngine } from './state.js';
import { sanitizeFranchisesForPublic } from './serializers.js';
import { googleSheetsService } from './services/sheets.js';

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

      // Asynchronous non-blocking push to Google Sheets
      const buyerFranchise = franchises.find((f) => f.id === sale.franchiseId);
      const player = auctionEngine.getPlayer(sale.playerId);
      if (player) {
        googleSheetsService.syncSaleToSheet({
          playerId: player.id,
          rollNumber: player.rollNumber,
          status: 'SOLD',
          soldPrice: sale.amount,
          buyerFranchiseName: buyerFranchise?.name || sale.franchiseId,
        }).catch((err) => console.error('Sheet Sync error:', err));
      }
    },
    onPlayerStatusChange: (player) => {
      io.emit('player_status_updated', player);
      if (player.status === 'UNSOLD') {
        googleSheetsService.syncSaleToSheet({
          playerId: player.id,
          rollNumber: player.rollNumber,
          status: 'UNSOLD',
          soldPrice: 0,
          buyerFranchiseName: '',
        }).catch((err) => console.error('Sheet Sync error:', err));
      } else if (player.status === 'AUCTIONABLE' && player.rollNumber) {
        googleSheetsService.syncUndoToSheet(player.rollNumber).catch((err) =>
          console.error('Sheet Undo Sync error:', err)
        );
      }
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
