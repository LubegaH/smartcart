// IndexedDB wrapper for offline data storage
import type { UserProfile } from '@/types'

interface OfflineData {
  id: string
  type: 'profile' | 'auth' | 'sync_queue'
  data: any
  timestamp: number
  synced: boolean
}

class OfflineStorage {
  private dbName = 'smartcart-offline'
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create stores
        if (!db.objectStoreNames.contains('data')) {
          const dataStore = db.createObjectStore('data', { keyPath: 'id' })
          dataStore.createIndex('type', 'type', { unique: false })
          dataStore.createIndex('synced', 'synced', { unique: false })
        }
      }
    })
  }

  async setItem(id: string, type: OfflineData['type'], data: any): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(['data'], 'readwrite')
    const store = transaction.objectStore('data')

    const item: OfflineData = {
      id,
      type,
      data,
      timestamp: Date.now(),
      synced: false
    }

    await new Promise<void>((resolve, reject) => {
      const request = store.put(item)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getItem(id: string): Promise<any | null> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(['data'], 'readonly')
    const store = transaction.objectStore('data')

    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.data : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getItemsByType(type: OfflineData['type']): Promise<any[]> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(['data'], 'readonly')
    const store = transaction.objectStore('data')
    const index = store.index('type')

    return new Promise((resolve, reject) => {
      const request = index.getAll(type)
      request.onsuccess = () => {
        const results = request.result.map(item => item.data)
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async removeItem(id: string): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(['data'], 'readwrite')
    const store = transaction.objectStore('data')

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async addToSyncQueue(action: string, data: any): Promise<void> {
    const queueId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await this.setItem(queueId, 'sync_queue', { action, data, timestamp: Date.now() })
  }

  async getSyncQueue(): Promise<Array<{ id: string; action: string; data: any; timestamp: number }>> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(['data'], 'readonly')
    const store = transaction.objectStore('data')
    const index = store.index('type')

    return new Promise((resolve, reject) => {
      const request = index.getAll('sync_queue')
      request.onsuccess = () => {
        const results = request.result.map(item => ({
          id: item.id,
          action: item.data.action,
          data: item.data.data,
          timestamp: item.data.timestamp
        }))
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(['data'], 'readwrite')
    const store = transaction.objectStore('data')
    const index = store.index('type')

    return new Promise((resolve, reject) => {
      const request = index.getAllKeys('sync_queue')
      request.onsuccess = () => {
        const keys = request.result
        let completed = 0

        if (keys.length === 0) {
          resolve()
          return
        }

        keys.forEach(key => {
          const deleteRequest = store.delete(key)
          deleteRequest.onsuccess = () => {
            completed++
            if (completed === keys.length) resolve()
          }
          deleteRequest.onerror = () => reject(deleteRequest.error)
        })
      }
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineStorage = new OfflineStorage()

// Profile-specific helpers
export const profileStorage = {
  async saveProfile(profile: UserProfile): Promise<void> {
    await offlineStorage.setItem(`profile_${profile.user_id}`, 'profile', profile)
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    return await offlineStorage.getItem(`profile_${userId}`)
  },

  async clearProfile(userId: string): Promise<void> {
    await offlineStorage.removeItem(`profile_${userId}`)
  },

  async queueProfileUpdate(updates: any): Promise<void> {
    await offlineStorage.addToSyncQueue('UPDATE_PROFILE', updates)
  }
}