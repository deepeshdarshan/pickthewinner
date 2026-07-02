/**
 * @fileoverview Leaderboard domain — pure business rules for rankings.
 * @module domain/leaderboard.domain
 */

export const LeaderboardDomain = {
  /**
   * @param {boolean} isAdmin
   * @param {boolean} leaderboardVisible
   * @returns {boolean}
   */
  canContestantViewLeaderboard(isAdmin, leaderboardVisible) {
    return isAdmin || leaderboardVisible === true;
  },

  /**
   * Sorts leaderboard entries by points descending, then name ascending.
   * @param {Array<{ totalPoints: number, displayName: string }>} entries
   * @returns {Array<{ totalPoints: number, displayName: string, rank: number }>}
   */
  rankEntries(entries) {
    const sorted = [...entries].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }

      return a.displayName.localeCompare(b.displayName);
    });

    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  },

  /**
   * @param {number} rank
   * @param {number} totalPlayers
   * @returns {boolean}
   */
  isTopRank(rank, totalPlayers) {
    return rank > 0 && rank <= Math.min(3, totalPlayers);
  },
};
