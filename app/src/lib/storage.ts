import type { AppState, Session, ActionId } from './types'

const STORAGE_KEY = 'personal_action_manager_v1'

const defaultState: AppState = { sessions: [] }

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw) as AppState
    if (!parsed || !Array.isArray(parsed.sessions)) return defaultState
    return { sessions: parsed.sessions }
  } catch {
    return defaultState
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function addSession(session: Session): void {
  const state = loadState()
  state.sessions.unshift(session)
  saveState(state)
}

export function getSessions(): Session[]
export function getSessions(actionId: 'action-1'): Extract<Session, { actionId: 'action-1' }> []
export function getSessions(actionId: 'action-2'): Extract<Session, { actionId: 'action-2' }> []
export function getSessions(actionId: 'action-3'): Extract<Session, { actionId: 'action-3' }> []
export function getSessions(actionId?: ActionId): any {
  const { sessions } = loadState()
  return actionId ? sessions.filter(s => s.actionId === actionId) : sessions
}

export function clearAll(): void {
  saveState(defaultState)
}

export function exportState(): string {
  return JSON.stringify(loadState(), null, 2)
}

export function importState(json: string): { imported: number } {
  const parsed = JSON.parse(json) as AppState
  if (!parsed || !Array.isArray(parsed.sessions)) {
    throw new Error('잘못된 데이터 형식입니다.')
  }
  // Basic shape validation
  const sessions = parsed.sessions.filter(Boolean)
  saveState({ sessions })
  return { imported: sessions.length }
}
