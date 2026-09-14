import { Match } from '../types';

/**
 * Sort matches strictly from sooner to later:
 * 1. Live matches first (in progress right now, ordered by elapsed period/start)
 * 2. Scheduled matches ordered chronologically by startTime ascending (soonest kickoff first)
 * 3. Finished / settled matches last
 */
export function sortMatchesSoonerFirst(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    // 1. Live status priority
    const aIsLive = a.status === 'live' || a.status === 'LIVE';
    const bIsLive = b.status === 'live' || b.status === 'LIVE';
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;

    // If both are live, keep most recent first
    if (aIsLive && bIsLive) {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return timeB - timeA;
    }

    // 2. Finished status priority (push to end)
    const aIsFinished = a.status === 'finished' || a.status === 'FINISHED';
    const bIsFinished = b.status === 'finished' || b.status === 'FINISHED';
    if (aIsFinished && !bIsFinished) return 1;
    if (!aIsFinished && bIsFinished) return -1;

    // 3. Both scheduled: strictly sooner to later (ascending startTime)
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();

    // If valid dates, compare them directly
    if (!isNaN(timeA) && !isNaN(timeB)) {
      return timeA - timeB;
    }

    return 0;
  });
}

/**
 * Returns a human-friendly countdown / kickoff label showing how soon a match begins
 */
export function getKickoffCountdown(startTime: string, status?: string): {
  label: string;
  isUrgent: boolean;
  startsInMinutes: number;
} {
  if (status === 'live' || status === 'LIVE') {
    return { label: 'LIVE IN PLAY', isUrgent: true, startsInMinutes: 0 };
  }
  if (status === 'finished' || status === 'FINISHED') {
    return { label: 'Final Result', isUrgent: false, startsInMinutes: -1 };
  }

  const matchTime = new Date(startTime).getTime();
  if (isNaN(matchTime)) {
    return { label: 'Upcoming', isUrgent: false, startsInMinutes: 9999 };
  }

  const now = Date.now();
  const diffMs = matchTime - now;
  const diffMinutes = Math.round(diffMs / (60 * 1000));

  if (diffMinutes <= 0) {
    return { label: 'Starting now', isUrgent: true, startsInMinutes: 0 };
  }

  if (diffMinutes < 60) {
    return {
      label: `Starts in ${diffMinutes}m`,
      isUrgent: true,
      startsInMinutes: diffMinutes
    };
  }

  const hours = Math.floor(diffMinutes / 60);
  const remainingMins = diffMinutes % 60;

  const matchDate = new Date(matchTime);
  const nowDate = new Date(now);
  const isToday = matchDate.toDateString() === nowDate.toDateString();

  const tomorrow = new Date(now + 24 * 3600 * 1000);
  const isTomorrow = matchDate.toDateString() === tomorrow.toDateString();

  const timeStr = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  if (isToday) {
    return {
      label: `Today ${timeStr} (in ${hours}h ${remainingMins > 0 ? `${remainingMins}m` : ''})`,
      isUrgent: hours < 3,
      startsInMinutes: diffMinutes
    };
  }

  if (isTomorrow) {
    return {
      label: `Tomorrow ${timeStr}`,
      isUrgent: false,
      startsInMinutes: diffMinutes
    };
  }

  const monthDay = matchDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return {
    label: `${monthDay} • ${timeStr}`,
    isUrgent: false,
    startsInMinutes: diffMinutes
  };
}
