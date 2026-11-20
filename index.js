/**
 * Host half of dsh-approval-notify.
 *
 * All behaviour lives in the Client half (`client.js`): only the page context
 * can post an Electron notification that carries the DeepSeek Harness app
 * icon. This export exists so the Loader row resolves.
 */
export function apply() {}
