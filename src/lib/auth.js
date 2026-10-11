export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("currentUser");
  if (!userStr) return null;
  try {
    const parsed = JSON.parse(userStr);
    
    // Fallback if email was missing during account creation
    if (!parsed.email) {
      if (parsed.name === "Ruan") {
        parsed.email = "ruan@coreforge.com";
      } else if (parsed.name?.includes("Mostert") || parsed.name?.includes("Arno")) {
        parsed.email = "arno@coreforge.com";
      }
    }
    return parsed;
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user) {
  if (typeof window === "undefined") return;
  localStorage.setItem("currentUser", JSON.stringify(user));
}

export function logoutUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("currentUser");
}