// Privacy-first storage utilities
import CryptoJS from 'crypto-js';

export interface StorageOptions {
  encrypt?: boolean;
  password?: string;
}

class PrivacyStorage {
  private static instance: PrivacyStorage;
  
  static getInstance(): PrivacyStorage {
    if (!this.instance) {
      this.instance = new PrivacyStorage();
    }
    return this.instance;
  }

  // Store data locally with optional encryption
  store<T>(key: string, data: T, options: StorageOptions = {}): void {
    try {
      let dataToStore = JSON.stringify(data);
      
      if (options.encrypt && options.password) {
        dataToStore = CryptoJS.AES.encrypt(dataToStore, options.password).toString();
      }
      
      localStorage.setItem(key, dataToStore);
    } catch (error) {
      throw new Error('Failed to store data locally');
    }
  }

  // Retrieve data from local storage with optional decryption
  retrieve<T>(key: string, options: StorageOptions = {}): T | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      let dataToRetrieve = stored;
      
      if (options.encrypt && options.password) {
        const decryptedBytes = CryptoJS.AES.decrypt(stored, options.password);
        dataToRetrieve = decryptedBytes.toString(CryptoJS.enc.Utf8);
        
        if (!dataToRetrieve) {
          throw new Error('Failed to decrypt data - wrong password?');
        }
      }
      
      return JSON.parse(dataToRetrieve);
    } catch (error) {
      return null;
    }
  }

  // Export user data for backup
  exportData(): void {
    const allData: Record<string, any> = {};
    
    // Collect all app data
    const keys = ['thoughts', 'clusterHierarchy', 'relevanceScores', 'clusterAdjustments'];
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        allData[key] = JSON.parse(data);
      }
    });
    
    // Create download
    const blob = new Blob([JSON.stringify(allData, null, 2)], { 
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

  // Import user data from backup
  importData(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          // Restore all data
          Object.keys(data).forEach(key => {
            localStorage.setItem(key, JSON.stringify(data[key]));
          });
          
          resolve();
        } catch (error) {
          reject(new Error('Invalid backup file'));
        }
      };
      reader.readAsText(file);
    });
  }

  // Clear all app data (for privacy)
  clearAllData(): void {
    const keys = ['thoughts', 'clusterHierarchy', 'relevanceScores', 'clusterAdjustments'];
    keys.forEach(key => localStorage.removeItem(key));
  }
}

export const privacyStorage = PrivacyStorage.getInstance(); 