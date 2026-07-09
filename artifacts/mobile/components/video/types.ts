export type AgoraCallState =
  | "connecting"
  | "waiting"
  | "connected"
  | "ended"
  | "permission-denied"
  | "setup-missing"
  | "token-error";

export interface AgoraCallSession {
  token: string;
  appId: string;
  channelName: string;
  uid: number;
  expiresAt: string;
  participantLabel: string;
  bookingId: string;
  accessToken: string;
}

export interface AgoraCallViewProps {
  session: AgoraCallSession;
  onEnd: () => void;
  onStateChange: (state: AgoraCallState, message?: string) => void;
}
