import { Timeline } from '@/types'

export interface WatchEvent {
  id: string
  time: string
  title: string
  category: string
  notes?: string | null
  isCompleted: boolean
}

export interface WatchProject {
  id: string
  coupleName: string
  date: string
  location?: string
  events: WatchEvent[]
  shotItems: WatchShotItem[]
  weddingModeActive: boolean
}

export interface WatchShotItem {
  id: string
  title: string
  category: string
  isCompleted: boolean
}

class WatchService {
  private initialized = false

  init() {
    if (this.initialized) return
    this.initialized = true
    
    window.addEventListener('watchAction', (e: any) => this.handleWatchAction(e.detail))
  }

  syncTimelines(timelines: Timeline[]) {
    try {
      const watchProjects: WatchProject[] = timelines.map(timeline => ({
        id: timeline._id,
        coupleName: timeline.couple?.partner1 && timeline.couple?.partner2
          ? `${timeline.couple.partner1} & ${timeline.couple.partner2}`
          : timeline.title,
        date: timeline.weddingDate,
        location: timeline.location || '',
        events: timeline.days
          .sort((a, b) => a.order - b.order)
          .flatMap(day =>
            day.events.map(event => ({
              id: event._id,
              time: event.time || '00:00',
              title: event.title,
              category: event.category,
              notes: event.location || null,
              isCompleted: event.isCompleted
            }))
          )
          .sort((a, b) => {
            const timeA = parseInt(a.time.replace(':', ''))
            const timeB = parseInt(b.time.replace(':', ''))
            return timeA - timeB
          }),
        shotItems: timeline.shotList.map(shot => ({
          id: shot._id,
          title: shot.title,
          category: shot.category,
          isCompleted: shot.isCompleted
        })),
        weddingModeActive: localStorage.getItem(`lenzu-wedding-mode-${timeline._id}`) !== null
      }))

      const data = JSON.stringify(watchProjects)
      ;(window as any).webkit?.messageHandlers?.watchBridge?.postMessage({
        action: 'syncProjects',
        data
      })
    } catch (e) {
      // Watch not available (running in browser)
    }
  }

  syncWeddingMode(projectId: string, active: boolean) {
    try {
      ;(window as any).webkit?.messageHandlers?.watchBridge?.postMessage({
        action: 'syncWeddingMode',
        projectId,
        active
      })
    } catch (e) {
      // Watch not available
    }
  }

  private handleWatchAction(detail: any) {
    const { action, data } = detail
    
    switch(action) {
      case 'startWeddingDay':
        window.dispatchEvent(new CustomEvent('startWeddingDayFromWatch', { detail: data }))
        break
      case 'finishWeddingDay':
        window.dispatchEvent(new CustomEvent('finishWeddingDayFromWatch', { detail: data }))
        break
      case 'toggleShotItem':
        window.dispatchEvent(new CustomEvent('toggleShotItemFromWatch', { detail: data }))
        break
      case 'requestSync':
        window.dispatchEvent(new CustomEvent('watchRequestsSync'))
        break
    }
  }
}

export const watchService = new WatchService()
