import { Franchise, Player, PublicFranchise, PublicPlayer } from '../core/types.js';

/**
 * §17 Privacy Requirement:
 * Mobile numbers must be excluded at the API level, not merely hidden in the interface.
 * Strips mobile and cricHeroesMobile unconditionally for public/broadcast exposure.
 */
export function sanitizePlayerForPublic(player: Player): PublicPlayer {
  const { mobile, cricHeroesMobile, ...publicPlayer } = player;
  return publicPlayer;
}

export function sanitizePlayersForPublic(players: Player[]): PublicPlayer[] {
  return players.map(sanitizePlayerForPublic);
}

/**
 * Strips coordinator and captain phone numbers for public/broadcast exposure.
 */
export function sanitizeFranchiseForPublic(franchise: Franchise): PublicFranchise {
  const { coordPhone, captainPhone, ...publicFranchise } = franchise;
  return publicFranchise;
}

export function sanitizeFranchisesForPublic(franchises: Franchise[]): PublicFranchise[] {
  return franchises.map(sanitizeFranchiseForPublic);
}
