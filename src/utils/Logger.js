import { prodOrNot } from './functions'

// eslint-disable-next-line no-console
export const info = (...args) => console.info(...args)

// eslint-disable-next-line no-console
export const warn = (...args) => console.warn(...args)

// eslint-disable-next-line no-console
export const error = (...args) => console.error(...args)

// eslint-disable-next-line no-console
export const log = (...args) => prodOrNot(undefined, () => console.log(...args))
