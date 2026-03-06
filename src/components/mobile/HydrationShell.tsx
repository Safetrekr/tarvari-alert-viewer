/**
 * Full-viewport void background rendered during viewport detection.
 * Matches the application's void background color (#050911) so
 * the transition to either DesktopView or MobileView is seamless.
 *
 * Used by the page orchestrator during viewport detection, not
 * exclusively by the mobile view.
 */
export function HydrationShell() {
  return (
    <div
      className="fixed inset-0"
      style={{ backgroundColor: '#050911' }}
      aria-hidden="true"
    />
  )
}
