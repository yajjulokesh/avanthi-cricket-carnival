import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { LotState, PublicFranchise, ScarcityStatus, AuctionSaleRecord } from '../../core/types.js';
import confetti from 'canvas-confetti';

export function useAuctionSocket(room: string = 'public') {
  const [lotState, setLotState] = useState<LotState | null>(null);
  const [franchises, setFranchises] = useState<PublicFranchise[]>([]);
  const [scarcities, setScarcities] = useState<ScarcityStatus[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [localSecondsLeft, setLocalSecondsLeft] = useState<number>(0);
  const [lastSale, setLastSale] = useState<AuctionSaleRecord | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to Socket.io
    const socket = io('/', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_room', room);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('lot_state_updated', (newLotState: LotState) => {
      setLotState(newLotState);
    });

    socket.on('franchises_updated', (newFranchises: PublicFranchise[]) => {
      setFranchises(newFranchises);
    });

    socket.on('scarcity_updated', (newScarcities: ScarcityStatus[]) => {
      setScarcities(newScarcities);
    });

    socket.on('sale_finalized', (sale: AuctionSaleRecord) => {
      setLastSale(sale);
      // Trigger confetti celebration on big screen / viewers
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#eab308', '#22c55e', '#3b82f6', '#ec4899'],
        });
      } catch (e) {
        // Ignore in non-browser envs
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [room]);

  // Client-side smooth timer interpolation based on server timerEndsAt
  useEffect(() => {
    if (!lotState?.timerEndsAt || lotState.status !== 'ACTIVE') {
      setLocalSecondsLeft(lotState?.timerSecondsRemaining || 0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((lotState.timerEndsAt! - now) / 1000));
      setLocalSecondsLeft(diff);
      if (diff === 0) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [lotState?.timerEndsAt, lotState?.status, lotState?.timerSecondsRemaining]);

  const placeBid = useCallback(
    (franchiseId: string, amount?: number): Promise<{ success: boolean; error?: string; newPrice?: number }> => {
      return new Promise((resolve) => {
        if (!socketRef.current) {
          resolve({ success: false, error: 'Socket not connected' });
          return;
        }
        socketRef.current.emit(
          'place_bid',
          { franchiseId, amount },
          (response: { success: boolean; error?: string; newPrice?: number }) => {
            resolve(response);
          }
        );
      });
    },
    []
  );

  const passLot = useCallback((franchiseId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('pass_lot', { franchiseId });
    }
  }, []);

  return {
    lotState,
    franchises,
    scarcities,
    isConnected,
    localSecondsLeft,
    lastSale,
    placeBid,
    passLot,
  };
}
