export type ActionId = 'action-1' | 'action-2' | 'action-3'

export interface SessionBase {
  id: string
  actionId: ActionId
  createdAt: string // ISO string
}

export interface SessionAction1 extends SessionBase {
  actionId: 'action-1'
  topic: string
  coreQuestion: string
  notes: string
}

export interface SessionAction2 extends SessionBase {
  actionId: 'action-2'
  observation: string
  analysis: string
}

export interface SessionAction3 extends SessionBase {
  actionId: 'action-3'
  problem: string
  reframes: string[]
}

export type Session = SessionAction1 | SessionAction2 | SessionAction3

export interface AppState {
  sessions: Session[]
}
