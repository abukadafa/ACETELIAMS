/** Escape user input used in MongoDB $regex filters (injection / ReDoS mitigation). */
export function escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
