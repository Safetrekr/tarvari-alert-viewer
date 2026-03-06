/**
 * Audio notification cue for P1 priority alerts.
 *
 * Plays a short alert tone via the HTML Audio API. Lazy-initializes
 * a single Audio instance and reuses it across calls. Silently fails
 * if autoplay is blocked or the Audio API is unavailable.
 *
 * @module notification-sound
 * @see WS-2.5 Section 4.8
 */

let audioInstance: HTMLAudioElement | null = null

/**
 * Play the P1 notification alert tone.
 *
 * Safe to call from any context -- no-ops in SSR or if the browser
 * blocks autoplay. Volume is moderate (0.3) to avoid startling.
 */
export function playNotificationSound(): void {
  if (typeof Audio === 'undefined') return

  if (!audioInstance) {
    audioInstance = new Audio('/sounds/alert-tone.mp3')
    audioInstance.volume = 0.3
  }

  audioInstance.currentTime = 0
  audioInstance.play().catch(() => {
    // Autoplay blocked by browser. Silently fail.
    // The user still receives the visual notification.
  })
}
