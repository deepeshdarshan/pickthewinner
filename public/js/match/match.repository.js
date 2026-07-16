/**
 * @fileoverview Match repository — Firestore data access for matches.
 * @module match/match.repository
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { db, ensureFirestoreOnline } from '../firebase/firebase.js';
import { BaseFirestoreService } from '../services/BaseFirestoreService.js';
import { MATCH_COLLECTIONS } from './match.constants.js';
import { MatchDomain, MATCH_STATUS } from '../domain/match.domain.js';
import { formatDateInput } from '../utils/date.util.js';

/**
 * @typedef {Object} MatchListFilters
 * @property {string} [tournamentId]
 * @property {string} [status]
 * @property {string} [date]
 * @property {string} [search]
 * @property {boolean} [contestantOnly]
 * @property {boolean} [excludeArchived]
 * @property {boolean} [archivedOnly]
 */

class MatchRepository extends BaseFirestoreService {
  constructor() {
    super({ collectionName: MATCH_COLLECTIONS.MATCHES, serviceName: 'MatchRepository' });
  }

  /**
   * @returns {import('firebase/firestore').CollectionReference}
   */
  getCollection() {
    return collection(db, this.collectionName);
  }

  /**
   * @param {string} tournamentId
   * @returns {Promise<number>}
   */
  async getNextMatchNumber(tournamentId) {
    await ensureFirestoreOnline();

    const snapshot = await getDocs(query(
      this.getCollection(),
      where('tournamentId', '==', tournamentId),
    ));

    if (snapshot.empty) {
      return 1;
    }

    const numbers = snapshot.docs
      .map((item) => Number(item.data().matchNumber ?? 0))
      .filter((value) => Number.isInteger(value));

    return numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
  }

  /**
   * @param {string} tournamentId
   * @returns {Promise<Array<{ id: string } & Record<string, unknown>>>}
   */
  async listByTournament(tournamentId) {
    await ensureFirestoreOnline();

    const snapshot = await getDocs(query(
      this.getCollection(),
      where('tournamentId', '==', tournamentId),
    ));

    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  }

  /**
   * @param {string} tournamentId
   * @param {string} homeTeamId
   * @param {string} awayTeamId
   * @param {Date} kickoffUtc
   * @param {string} [excludeMatchId]
   * @returns {Promise<boolean>}
   */
  async hasDuplicate(tournamentId, homeTeamId, awayTeamId, kickoffUtc, excludeMatchId) {
    await ensureFirestoreOnline();

    const snapshot = await getDocs(query(
      this.getCollection(),
      where('tournamentId', '==', tournamentId),
    ));

    const candidate = { tournamentId, homeTeamId, awayTeamId, kickoffUtc };

    return snapshot.docs.some((item) => {
      if (excludeMatchId && item.id === excludeMatchId) {
        return false;
      }

      const data = item.data();
      return MatchDomain.isDuplicateMatch(
        {
          tournamentId: data.tournamentId,
          homeTeamId: data.homeTeamId,
          awayTeamId: data.awayTeamId,
          kickoffUtc: toDate(data.kickoffUtc),
        },
        candidate,
      );
    });
  }

  /**
   * @param {MatchListFilters} [filters]
   * @returns {Promise<Array<{ id: string } & Record<string, unknown>>>}
   */
  async list(filters = {}) {
    await ensureFirestoreOnline();

    const excludeArchived = filters.excludeArchived !== false;
    const snapshot = await getDocs(query(this.getCollection(), orderBy('kickoffUtc', 'asc')));
    let matches = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

    if (filters.archivedOnly) {
      matches = matches.filter((match) => String(match.status ?? '') === MATCH_STATUS.ARCHIVED);
    } else if (excludeArchived) {
      matches = matches.filter((match) => String(match.status ?? '') !== MATCH_STATUS.ARCHIVED);
    }

    if (filters.tournamentId) {
      matches = matches.filter((match) => match.tournamentId === filters.tournamentId);
    }

    if (filters.contestantOnly) {
      matches = matches.filter((match) => MatchDomain.isVisibleToContestants(
        String(match.status ?? ''),
        Boolean(match.visible),
      ));
    }

    if (filters.status) {
      matches = matches.filter((match) => match.status === filters.status);
    }

    if (filters.date) {
      matches = matches.filter((match) => {
        const kickoff = toDate(match.kickoffUtc);
        return kickoff ? formatDateInput(kickoff) === filters.date : false;
      });
    }

    if (filters.search) {
      const term = filters.search.toLowerCase();
      matches = matches.filter((match) => JSON.stringify(match).toLowerCase().includes(term));
    }

    return matches;
  }

  /**
   * @param {Record<string, unknown>} data
   * @returns {Promise<string>}
   */
  async add(data) {
    await ensureFirestoreOnline();
    const ref = await addDoc(this.getCollection(), data);
    return ref.id;
  }
}

/**
 * @param {unknown} value
 * @returns {Date|null}
 */
function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }

  return null;
}

export const matchRepository = new MatchRepository();
