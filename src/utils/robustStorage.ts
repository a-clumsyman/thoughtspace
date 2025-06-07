// Robust local storage using IndexedDB + Persistent Storage API
import { Thought } from '../types';

class RobustStorage {
  private dbName = 'ADHDThoughtsDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  // Initialize the database
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create thoughts store
        if (!db.objectStoreNames.contains('thoughts')) {
          const thoughtStore = db.createObjectStore('thoughts', { keyPath: 'id' });
          thoughtStore.createIndex('createdAt', 'createdAt', { unique: false });
          thoughtStore.createIndex('category', 'category', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  // Request persistent storage (prevents automatic deletion)
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const granted = await navigator.storage.persist();
    
        return granted;
              } catch (error) {
          return false;
        }
    }
    return false;
  }

  // Check storage quota
  async getStorageInfo(): Promise<{ used: number; quota: number; persistent: boolean }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const persistent = await navigator.storage.persisted();
      
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
        persistent: persistent || false
      };
    }
    
    return { used: 0, quota: 0, persistent: false };
  }

  // Save thought
  async saveThought(thought: Thought): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['thoughts'], 'readwrite');
      const store = transaction.objectStore('thoughts');
      const request = store.put(thought);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get all thoughts
  async getAllThoughts(): Promise<Thought[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['thoughts'], 'readonly');
      const store = transaction.objectStore('thoughts');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete thought
  async deleteThought(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['thoughts'], 'readwrite');
      const store = transaction.objectStore('thoughts');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Export all data as JSON
  async exportData(): Promise<void> {
    const thoughts = await this.getAllThoughts();
    const storageInfo = await this.getStorageInfo();
    
    const exportData = {
      thoughts,
      metadata: {
        exportDate: new Date().toISOString(),
        version: this.version,
        storageInfo
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thoughts-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Import data from JSON
  async importData(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          // Clear existing data
          await this.clearAllData();
          
          // Import thoughts
          for (const thought of data.thoughts) {
            await this.saveThought({
              ...thought,
              createdAt: new Date(thought.createdAt),
              updatedAt: new Date(thought.updatedAt)
            });
          }
          
          resolve();
        } catch (error) {
          reject(new Error('Invalid backup file'));
        }
      };
      reader.readAsText(file);
    });
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['thoughts'], 'readwrite');
      const store = transaction.objectStore('thoughts');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const robustStorage = new RobustStorage(); 