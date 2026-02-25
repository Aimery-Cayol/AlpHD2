// =============================================================================
// Client WebSocket — AlpHD données temps réel
// =============================================================================
// Reconnexion exponentielle, heartbeat, gestion d'onglets multiples.
// Singleton : une seule connexion partagée dans toute l'app.
// =============================================================================

import type { WSMessage, WSEventType } from "@/types/data-layers";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEFAULT_OPTIONS: Required<WSClientOptions> = {
  url: process.env.NEXT_PUBLIC_WS_URL ?? "wss://ws.alphd.example.com/realtime",
  reconnectBaseMs: 1_000,
  reconnectMaxMs: 30_000,
  reconnectMaxAttempts: 10,
  heartbeatIntervalMs: 25_000,
  debug: process.env.NODE_ENV === "development",
};

export interface WSClientOptions {
  url?: string;
  /** Délai de base pour la reconnexion exponentielle (ms) */
  reconnectBaseMs?: number;
  /** Délai maximum entre deux tentatives de reconnexion (ms) */
  reconnectMaxMs?: number;
  /** 0 = infini */
  reconnectMaxAttempts?: number;
  /** Intervalle du ping heartbeat (ms) */
  heartbeatIntervalMs?: number;
  debug?: boolean;
}

// ---------------------------------------------------------------------------
// Types internes
// ---------------------------------------------------------------------------

type Listener<T = unknown> = (payload: T, message: WSMessage<T>) => void;

interface Subscription {
  event: WSEventType | "*";
  listener: Listener;
}

// ---------------------------------------------------------------------------
// Classe principale
// ---------------------------------------------------------------------------

export class AlpHDWebSocketClient {
  private opts: Required<WSClientOptions>;
  private ws: WebSocket | null = null;
  private subscriptions: Subscription[] = [];
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private intentionalClose = false;

  // Callbacks d'état
  private onConnectCallbacks: Array<() => void> = [];
  private onDisconnectCallbacks: Array<(code: number) => void> = [];
  private onReconnectCallbacks: Array<(attempt: number) => void> = [];
  private onMaxAttemptsCallbacks: Array<() => void> = [];

  constructor(options: WSClientOptions = {}) {
    this.opts = { ...DEFAULT_OPTIONS, ...options };
  }

  // ---------------------------------------------------------------------------
  // Connexion / déconnexion
  // ---------------------------------------------------------------------------

  connect(): void {
    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    this.intentionalClose = false;
    this.log("Connexion à", this.opts.url);

    try {
      this.ws = new WebSocket(this.opts.url);
    } catch (err) {
      this.log("Erreur WebSocket constructor:", err);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.log("Connecté");
      this.reconnectAttempt = 0;
      this.startHeartbeat();
      this.onConnectCallbacks.forEach((cb) => cb());
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this.handleMessage(event.data);
    };

    this.ws.onerror = (event) => {
      this.log("Erreur WebSocket:", event);
    };

    this.ws.onclose = (event) => {
      this.log("Déconnecté, code:", event.code);
      this.stopHeartbeat();
      this.onDisconnectCallbacks.forEach((cb) => cb(event.code));
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();
    this.ws?.close(1000, "Client disconnect");
    this.ws = null;
    this.log("Déconnexion volontaire");
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ---------------------------------------------------------------------------
  // Abonnements
  // ---------------------------------------------------------------------------

  /** S'abonner à un événement précis ou "*" pour tous */
  on<T = unknown>(
    event: WSEventType | "*",
    listener: Listener<T>
  ): () => void {
    const sub: Subscription = { event, listener: listener as Listener };
    this.subscriptions.push(sub);
    return () => {
      this.subscriptions = this.subscriptions.filter((s) => s !== sub);
    };
  }

  /** S'abonner une seule fois */
  once<T = unknown>(
    event: WSEventType | "*",
    listener: Listener<T>
  ): () => void {
    let unsub: (() => void) | null = null;
    const wrapped: Listener<T> = (payload, msg) => {
      listener(payload, msg);
      unsub?.();
    };
    unsub = this.on<T>(event, wrapped);
    return unsub;
  }

  // ---------------------------------------------------------------------------
  // Callbacks de cycle de vie
  // ---------------------------------------------------------------------------

  onConnect(cb: () => void): () => void {
    this.onConnectCallbacks.push(cb);
    return () => {
      this.onConnectCallbacks = this.onConnectCallbacks.filter((c) => c !== cb);
    };
  }

  onDisconnect(cb: (code: number) => void): () => void {
    this.onDisconnectCallbacks.push(cb);
    return () => {
      this.onDisconnectCallbacks = this.onDisconnectCallbacks.filter((c) => c !== cb);
    };
  }

  onReconnect(cb: (attempt: number) => void): () => void {
    this.onReconnectCallbacks.push(cb);
    return () => {
      this.onReconnectCallbacks = this.onReconnectCallbacks.filter((c) => c !== cb);
    };
  }

  onMaxAttempts(cb: () => void): () => void {
    this.onMaxAttemptsCallbacks.push(cb);
    return () => {
      this.onMaxAttemptsCallbacks = this.onMaxAttemptsCallbacks.filter((c) => c !== cb);
    };
  }

  // ---------------------------------------------------------------------------
  // Reconnexion exponentielle
  // ---------------------------------------------------------------------------

  private scheduleReconnect(): void {
    const max = this.opts.reconnectMaxAttempts;
    if (max > 0 && this.reconnectAttempt >= max) {
      this.log("Nombre max de tentatives atteint");
      this.onMaxAttemptsCallbacks.forEach((cb) => cb());
      return;
    }

    const delay = Math.min(
      this.opts.reconnectBaseMs * 2 ** this.reconnectAttempt,
      this.opts.reconnectMaxMs
    );

    this.log(`Reconnexion dans ${delay}ms (tentative ${this.reconnectAttempt + 1})`);
    this.reconnectAttempt++;
    this.onReconnectCallbacks.forEach((cb) => cb(this.reconnectAttempt));

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Heartbeat (ping pour maintenir la connexion ouverte)
  // ---------------------------------------------------------------------------

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
        this.log("♥ ping");
      }
    }, this.opts.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Traitement des messages entrants
  // ---------------------------------------------------------------------------

  private handleMessage(raw: string): void {
    let msg: WSMessage;
    try {
      msg = JSON.parse(raw) as WSMessage;
    } catch {
      this.log("Message non-JSON reçu:", raw);
      return;
    }

    // Pong heartbeat — ignorer
    if ((msg as unknown as { type: string }).type === "pong") {
      this.log("♥ pong");
      return;
    }

    this.log("Message reçu:", msg.event);

    for (const sub of this.subscriptions) {
      if (sub.event === "*" || sub.event === msg.event) {
        try {
          sub.listener(msg.payload, msg);
        } catch (err) {
          console.error("[WSClient] Erreur dans listener:", err);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Debug
  // ---------------------------------------------------------------------------

  private log(...args: unknown[]): void {
    if (this.opts.debug) {
      console.log("[AlpHD WS]", ...args);
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton — une connexion partagée dans toute l'app
// ---------------------------------------------------------------------------

let _instance: AlpHDWebSocketClient | null = null;

export function getWSClient(options?: WSClientOptions): AlpHDWebSocketClient {
  if (!_instance) {
    _instance = new AlpHDWebSocketClient(options);
  }
  return _instance;
}

/** Réinitialiser le singleton (tests uniquement) */
export function resetWSClient(): void {
  _instance?.disconnect();
  _instance = null;
}
