export interface UserProfile {
  name: string
  title?: string
  email?: string
  website?: string
  bio?: string
  expertise?: string[]
  persona?: string
  goals?: string
  useInPrompts?: boolean
}

const KEY = 'user_profile_v1'

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { name: '' }
    const obj = JSON.parse(raw)
    return {
      name: String(obj.name||''),
      title: obj.title ? String(obj.title) : undefined,
      email: obj.email ? String(obj.email) : undefined,
      website: obj.website ? String(obj.website) : undefined,
      bio: obj.bio ? String(obj.bio) : undefined,
      expertise: Array.isArray(obj.expertise) ? obj.expertise.map((x:any)=>String(x)) : undefined,
      persona: obj.persona ? String(obj.persona) : undefined,
      goals: obj.goals ? String(obj.goals) : undefined,
      useInPrompts: !!obj.useInPrompts,
    }
  } catch {
    return { name: '' }
  }
}

export function saveProfile(p: UserProfile) {
  localStorage.setItem(KEY, JSON.stringify(p))
}
