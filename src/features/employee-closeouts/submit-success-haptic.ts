export function triggerSubmitSuccessHaptic() {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate([40, 24, 40]);
}
