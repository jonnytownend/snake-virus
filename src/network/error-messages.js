function getErrorCode(error) {
  return String(error?.code || "");
}

function includesIgnoreCase(text, pattern) {
  return text.toLowerCase().includes(pattern.toLowerCase());
}

export function formatMultiplayerJoinError(error) {
  const code = getErrorCode(error);
  const message = String(error?.message || "");

  if (code === "config/invalid") {
    return "Firebase config is invalid or incomplete. Recheck apiKey/authDomain/projectId and related fields.";
  }

  if (code === "sdk/load-failed") {
    return "Could not load Firebase SDK from gstatic. Check network/firewall or ad-block settings.";
  }

  if (code === "room/join-failed") {
    return "Room allocation failed after retries. Try again in a moment.";
  }

  if (code === "permission-denied") {
    return "Firestore denied access. Enable test rules or allow authenticated users in rules.";
  }

  if (code === "failed-precondition") {
    return "Firestore not ready. Create a Firestore database in your Firebase project.";
  }

  if (code === "unavailable") {
    return "Firebase unreachable. Check your network and try again.";
  }

  if (
    code === "auth/operation-not-allowed" ||
    code === "auth/configuration-not-found" ||
    code === "auth/admin-restricted-operation"
  ) {
    return "Anonymous auth is disabled. Enable it in Firebase Auth or loosen Firestore rules.";
  }

  if (code === "auth/app-not-authorized" || code === "auth/unauthorized-domain") {
    return "This host is not authorized for Firebase Auth. Add localhost to Authorized domains.";
  }

  if (code === "auth/invalid-api-key") {
    return "Invalid Firebase API key. Verify the config values for this web app.";
  }

  if (code === "auth/network-request-failed") {
    return "Auth request failed over network. Check connectivity/firewall and retry.";
  }

  if (includesIgnoreCase(code, "api-key")) {
    return "Firebase API key is rejected. Check key value and API key restrictions.";
  }

  if (includesIgnoreCase(message, "API has not been used") || includesIgnoreCase(message, "not been used")) {
    return "Firestore API is disabled for this project. Enable it in Google Cloud/Firebase console.";
  }

  if (includesIgnoreCase(message, "Failed to fetch dynamically imported module")) {
    return "Could not download Firebase SDK modules. Check network/firewall or ad-block settings.";
  }

  if (code) {
    return `Failed to connect to multiplayer (${code}). Check Firebase config/network.`;
  }

  return "Failed to connect to multiplayer. Check Firebase config/network.";
}
