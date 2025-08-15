// Custom error creator
export function createCloneError(message: string, details: any, stats?: any) {
  return {
    error: message,
    details,
    ...(stats && { statistics: stats }),
  }
}
