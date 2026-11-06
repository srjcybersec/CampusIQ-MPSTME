export type SnehaInputMode = "voice" | "text" | "both";

export interface SnehaDeviceCapabilities {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalonePwa: boolean;
  hasSpeechRecognition: boolean;
  hasSpeechSynthesis: boolean;
  inputMode: SnehaInputMode;
  platformHint: string;
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function getSnehaDeviceCapabilities(): SnehaDeviceCapabilities {
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      isStandalonePwa: false,
      hasSpeechRecognition: false,
      hasSpeechSynthesis: false,
      inputMode: "text",
      platformHint: "",
    };
  }

  const isIOS = detectIOS();
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid || /Mobile/i.test(navigator.userAgent);
  const isStandalonePwa =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  const hasSpeechRecognition =
    !isIOS &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const hasSpeechSynthesis = "speechSynthesis" in window;

  let inputMode: SnehaInputMode = "voice";
  let platformHint = "";

  if (isIOS) {
    inputMode = "text";
    platformHint =
      "Voice input isn't available in the iPhone/iPad app. Type your command below — SNEHA will still read answers aloud.";
  } else if (!hasSpeechRecognition) {
    inputMode = "text";
    platformHint = "Speech recognition isn't supported here. Type your command below.";
  } else if (isMobile || isStandalonePwa) {
    inputMode = "voice";
    platformHint = "Tap the mic and speak clearly — SNEHA will show what you say and respond aloud.";
  }

  return {
    isMobile,
    isIOS,
    isAndroid,
    isStandalonePwa,
    hasSpeechRecognition,
    hasSpeechSynthesis,
    inputMode,
    platformHint,
  };
}

/** Mobile/PWA: Web Speech API is fragile with continuous mode and shared mic access. */
export function isMobileSpeechRecognitionMode(caps: SnehaDeviceCapabilities): boolean {
  return caps.isMobile || caps.isStandalonePwa;
}

/** iOS blocks speechSynthesis unless audio is unlocked during the user's tap. */
export function unlockSpeechSynthesis(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(" ");
    utterance.volume = 0.01;
    utterance.rate = 10;
    window.speechSynthesis.speak(utterance);
    window.speechSynthesis.cancel();
  } catch {
    // Ignore unlock failures
  }
}
