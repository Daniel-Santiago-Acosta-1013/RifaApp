const STORAGE_KEY = "rifaapp_participants";

type ParticipantMap = Record<string, string>;

const readMap = (): ParticipantMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as ParticipantMap;
  } catch {
    return {};
  }
};

export const getParticipantId = (email: string) => {
  if (!email) {
    return null;
  }
  const map = readMap();
  return map[email.toLowerCase()] || null;
};

export const setParticipantId = (email: string, participantId: string) => {
  if (!email || !participantId) {
    return;
  }
  const map = readMap();
  map[email.toLowerCase()] = participantId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
};
