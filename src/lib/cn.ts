/** Join class names, skipping falsy values. (Avoid passing conflicting utilities: order does not decide the winner.) */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
