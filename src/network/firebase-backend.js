import { chooseRoomForJoin } from "./room-logic.js";

export const FIREBASE_DEMO_CONFIG = Object.freeze({
  apiKey: "AIzaSyD5aaYlEOdziFWWMQxQkmVj3Pn7POD2ASg",
  authDomain: "snake-virus.firebaseapp.com",
  projectId: "snake-virus",
  storageBucket: "snake-virus.firebasestorage.app",
  messagingSenderId: "575294686498",
  appId: "1:575294686498:web:0bd6274a409a39db4fd17b",
  measurementId: "G-DYR95Y4K6V"
});

const ROOMS_COLLECTION = "snake_virus_rooms";
const PLAYERS_SUBCOLLECTION = "players";
const JOIN_RETRY_ATTEMPTS = 6;
const REQUIRED_CONFIG_KEYS = Object.freeze([
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId"
]);

let sdkCache = null;

function createCodedError(code, message, cause = null) {
  const error = new Error(message);
  error.code = code;
  if (cause) error.cause = cause;
  return error;
}

function resolveRuntimeConfig(config = null) {
  if (config) return config;
  const runtimeConfig =
    globalThis.__SNAKE_VIRUS_FIREBASE_CONFIG__ || globalThis.SNAKE_VIRUS_FIREBASE_CONFIG__;
  return runtimeConfig || FIREBASE_DEMO_CONFIG;
}

function validateFirebaseConfig(config) {
  if (!config || typeof config !== "object") {
    throw createCodedError("config/invalid", "Firebase config is missing or not an object.");
  }

  const missingKeys = REQUIRED_CONFIG_KEYS.filter((key) => {
    return typeof config[key] !== "string" || config[key].trim() === "";
  });

  if (missingKeys.length > 0) {
    throw createCodedError(
      "config/invalid",
      `Firebase config is missing required keys: ${missingKeys.join(", ")}.`
    );
  }
}

function isDemoConfig(config) {
  if (!config) return false;
  return (
    config.projectId === FIREBASE_DEMO_CONFIG.projectId &&
    config.apiKey === FIREBASE_DEMO_CONFIG.apiKey
  );
}

function createPlayerId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `p_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

async function loadFirebaseSdk() {
  if (sdkCache) return sdkCache;

  let appModule;
  let firestoreModule;
  let authModule;
  try {
    [appModule, firestoreModule, authModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js")
    ]);
  } catch (error) {
    throw createCodedError(
      "sdk/load-failed",
      "Unable to load Firebase SDK modules from gstatic.",
      error
    );
  }

  sdkCache = {
    initializeApp: appModule.initializeApp,
    getApps: appModule.getApps,
    getApp: appModule.getApp,
    getFirestore: firestoreModule.getFirestore,
    collection: firestoreModule.collection,
    doc: firestoreModule.doc,
    getDocs: firestoreModule.getDocs,
    runTransaction: firestoreModule.runTransaction,
    query: firestoreModule.query,
    orderBy: firestoreModule.orderBy,
    limit: firestoreModule.limit,
    onSnapshot: firestoreModule.onSnapshot,
    setDoc: firestoreModule.setDoc,
    serverTimestamp: firestoreModule.serverTimestamp,
    increment: firestoreModule.increment,
    getAuth: authModule.getAuth,
    signInAnonymously: authModule.signInAnonymously
  };

  return sdkCache;
}

export class FirebaseBackend {
  constructor(config = null) {
    this.config = resolveRuntimeConfig(config);
    this.app = null;
    this.db = null;
    this.auth = null;
    this.sdk = null;
  }

  async ensureReady() {
    if (this.db) return;
    validateFirebaseConfig(this.config);
    if (isDemoConfig(this.config)) {
      console.warn(
        "[Snake Virus] Using bundled demo Firebase config. Override with your project config before multiplayer testing."
      );
    }
    this.sdk = await loadFirebaseSdk();
    const {
      initializeApp,
      getApps,
      getApp,
      getFirestore,
      getAuth,
      signInAnonymously
    } = this.sdk;

    try {
      this.app = getApps().length > 0 ? getApp() : initializeApp(this.config);
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);
    } catch (error) {
      throw createCodedError(
        "config/invalid",
        "Firebase failed to initialize. Verify your project config values.",
        error
      );
    }

    if (!this.auth.currentUser) {
      try {
        await signInAnonymously(this.auth);
      } catch (error) {
        const code = error?.code || "";
        const isNonBlockingAuthConfigError =
          code === "auth/operation-not-allowed" ||
          code === "auth/admin-restricted-operation" ||
          code === "auth/configuration-not-found";

        if (!isNonBlockingAuthConfigError) throw error;
      }
    }
  }

  async joinRoom({ name, maxPlayers }) {
    await this.ensureReady();

    const {
      collection,
      doc,
      getDocs,
      runTransaction,
      query,
      orderBy,
      limit,
      serverTimestamp
    } = this.sdk;

    const roomsRef = collection(this.db, ROOMS_COLLECTION);
    const playerId = createPlayerId();
    const roomQuery = query(roomsRef, orderBy("activeCount", "asc"), limit(25));

    for (let attempt = 0; attempt < JOIN_RETRY_ATTEMPTS; attempt += 1) {
      const snapshot = await getDocs(roomQuery);
      const rooms = snapshot.docs.map((item) => ({ id: item.id, ...item.data(), ref: item.ref }));
      const chosen = chooseRoomForJoin(rooms, maxPlayers);
      const roomRef = chosen ? chosen.ref : doc(roomsRef);
      const isNewRoom = !chosen;

      try {
        const roomId = await runTransaction(this.db, async (tx) => {
          if (isNewRoom) {
            tx.set(roomRef, {
              activeCount: 1,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } else {
            const roomSnap = await tx.get(roomRef);
            const roomData = roomSnap.exists() ? roomSnap.data() : {};
            const activeCount = Math.max(0, Number(roomData.activeCount) || 0);

            if (activeCount >= maxPlayers) {
              throw createCodedError("room/full-retry", "Room reached max players during join.");
            }

            tx.set(
              roomRef,
              {
                activeCount: activeCount + 1,
                updatedAt: serverTimestamp()
              },
              { merge: true }
            );
          }

          const playerRef = doc(roomRef, PLAYERS_SUBCOLLECTION, playerId);
          tx.set(playerRef, {
            id: playerId,
            name,
            score: 0,
            stage: 1,
            snake: [],
            gameOver: false,
            gameOverReason: null,
            running: false,
            status: "active",
            joinedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          return roomRef.id;
        });

        return { roomId, playerId };
      } catch (error) {
        if (error?.code === "room/full-retry" && attempt < JOIN_RETRY_ATTEMPTS - 1) {
          continue;
        }
        throw error;
      }
    }

    throw createCodedError("room/join-failed", "Unable to assign player to a room.");
  }

  subscribeToRoomPlayers(roomId, onPlayersChanged) {
    const { collection, onSnapshot } = this.sdk;
    const playersRef = collection(this.db, ROOMS_COLLECTION, roomId, PLAYERS_SUBCOLLECTION);

    return onSnapshot(playersRef, (snapshot) => {
      const players = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      onPlayersChanged(players);
    });
  }

  async updatePlayerState({ roomId, playerId, payload }) {
    await this.ensureReady();
    const { doc, setDoc, serverTimestamp } = this.sdk;

    const playerRef = doc(this.db, ROOMS_COLLECTION, roomId, PLAYERS_SUBCOLLECTION, playerId);
    await setDoc(
      playerRef,
      {
        ...payload,
        status: "active",
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  async leaveRoom({ roomId, playerId, reason = "left" }) {
    await this.ensureReady();
    const { doc, runTransaction, serverTimestamp } = this.sdk;

    const roomRef = doc(this.db, ROOMS_COLLECTION, roomId);
    const playerRef = doc(this.db, ROOMS_COLLECTION, roomId, PLAYERS_SUBCOLLECTION, playerId);

    await runTransaction(this.db, async (tx) => {
      const roomSnap = await tx.get(roomRef);
      const playerSnap = await tx.get(playerRef);
      const roomData = roomSnap.exists() ? roomSnap.data() : {};
      const playerData = playerSnap.exists() ? playerSnap.data() : null;

      if (playerData && playerData.status !== "left") {
        const nextCount = Math.max(0, Number(roomData.activeCount || 1) - 1);
        tx.set(
          roomRef,
          {
            activeCount: nextCount,
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
      }

      tx.set(
        playerRef,
        {
          status: "left",
          gameOver: true,
          gameOverReason: reason,
          running: false,
          snake: [],
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    });
  }
}

export function createFirebaseBackend(config = null) {
  return new FirebaseBackend(config);
}
