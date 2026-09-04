/**
 * The admin date pattern, in one place.
 *
 * `payload.config.ts` sets `admin.dateFormat` from it. `useFormattedDate` falls back to it,
 * because Payload ships no admin config to a client with no session, such as a share page.
 */
export const ADMIN_DATE_FORMAT = 'dd.MM.yyyy HH:mm'
