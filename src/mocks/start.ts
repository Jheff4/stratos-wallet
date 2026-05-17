import { worker } from './browser'

export async function startMSW() {
  if (import.meta.env.MODE !== 'development') return

  await worker.start({
    onUnhandledRequest: 'bypass',
  })
}