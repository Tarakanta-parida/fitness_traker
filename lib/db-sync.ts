/**
 * IndexedDB Offline caching and auto-sync utility for LifeTrack
 */

export interface OfflineStepLog {
  id?: number;
  date: string; // YYYY-MM-DD
  steps: number;
  distance: number;
  caloriesBurned: number;
  activeSeconds: number;
  createdAt: number; // Timestamp
  synced: number; // 0 = false, 1 = true
}

const DB_NAME = "LifeTrackOfflineDB";
const STORE_NAME = "stepLogs";
const DB_VERSION = 1;

// Init IndexedDB connection helper
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject("IndexedDB is not supported on Server-side.");
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        store.createIndex("synced", "synced", { unique: false });
        store.createIndex("date", "date", { unique: false });
      }
    };
  });
}

/**
 * Cache step increments locally inside IndexedDB
 */
export async function cacheStepsOffline(
  steps: number,
  distance: number,
  caloriesBurned: number,
  activeSeconds: number
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // Get today's local date in YYYY-MM-DD format
    const todayStr = new Date().toLocaleDateString("sv-SE"); // sv-SE outputs YYYY-MM-DD

    // Fetch existing unsynced records for today to aggregate if possible
    const index = store.index("date");
    const request = index.getAll(todayStr);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const records: OfflineStepLog[] = request.result || [];
        const unsyncedRecord = records.find(r => r.synced === 0);

        if (unsyncedRecord) {
          // Update existing unsynced block
          unsyncedRecord.steps += steps;
          unsyncedRecord.distance = parseFloat((unsyncedRecord.distance + distance).toFixed(4));
          unsyncedRecord.caloriesBurned = parseFloat((unsyncedRecord.caloriesBurned + caloriesBurned).toFixed(2));
          unsyncedRecord.activeSeconds += activeSeconds;
          unsyncedRecord.createdAt = Date.now();
          store.put(unsyncedRecord);
        } else {
          // Create new unsynced entry
          const newRecord: OfflineStepLog = {
            date: todayStr,
            steps,
            distance: parseFloat(distance.toFixed(4)),
            caloriesBurned: parseFloat(caloriesBurned.toFixed(2)),
            activeSeconds,
            createdAt: Date.now(),
            synced: 0
          };
          store.add(newRecord);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB cacheStepsOffline failed:", err);
  }
}

/**
 * Get all unsynced steps from IndexedDB
 */
export async function getUnsyncedSteps(): Promise<OfflineStepLog[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("synced");
    const request = index.getAll(0); // 0 = unsynced

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Failed to retrieve unsynced steps:", err);
    return [];
  }
}

/**
 * Mark a batch of IndexedDB records as successfully synced
 */
export async function markStepsAsSynced(ids: number[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    for (const id of ids) {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const record = getReq.result;
        if (record) {
          record.synced = 1;
          store.put(record);
        }
      };
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("Failed to mark steps as synced in IndexedDB:", err);
  }
}

/**
 * Synchronize all offline unsynced step logs with PostgreSQL server
 */
export async function syncOfflineStepsWithServer(): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.onLine) return false;

  const unsynced = await getUnsyncedSteps();
  if (unsynced.length === 0) return true;

  try {
    const response = await fetch("/api/steps/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs: unsynced }),
    });

    if (response.ok) {
      const result = await response.json();
      const syncedIds = unsynced.map(r => r.id).filter((id): id is number => id !== undefined);
      await markStepsAsSynced(syncedIds);
      console.log(`Successfully synced ${syncedIds.length} offline step blocks.`);
      return true;
    }
  } catch (error) {
    console.error("IndexedDB server synchronization error:", error);
  }
  return false;
}

/**
 * Retrieve total steps cache for a specific date ( Швеция format: YYYY-MM-DD )
 */
export async function getLocalStepsForDate(dateStr: string): Promise<{ steps: number; distance: number; calories: number } | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("date");
    const request = index.getAll(dateStr);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const records: OfflineStepLog[] = request.result || [];
        if (records.length === 0) {
          resolve(null);
          return;
        }

        let totalSteps = 0;
        let totalDistance = 0;
        let totalCalories = 0;

        records.forEach(r => {
          totalSteps += r.steps;
          totalDistance += r.distance;
          totalCalories += r.caloriesBurned;
        });

        resolve({ steps: totalSteps, distance: totalDistance, calories: totalCalories });
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    return null;
  }
}
