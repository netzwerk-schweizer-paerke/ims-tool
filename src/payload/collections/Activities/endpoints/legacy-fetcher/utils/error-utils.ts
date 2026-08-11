// Custom error creator
export function createCloneError(message: string, details: any, stats?: any) {
  return {
    details,
    error: message,
    ...(stats && { statistics: stats }),
  }
}
