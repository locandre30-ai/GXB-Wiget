// Older WebKit contexts may expose IndexedDB without Web Locks. A readwrite
// transaction on one store serializes the synchronous localStorage operation.
export function storageLock() {
  let webLocks;
  try { webLocks = navigator.locks; } catch { /* use the fallback */ }
  if (webLocks && typeof webLocks.request === 'function') return webLocks;

  let database;
  function open() {
    if (!database) database = new Promise((resolve, reject) => {
      const request = indexedDB.open('gxb-arena-write-lock', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('gate');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Browser storage is blocked.'));
      request.onblocked = () => reject(new Error('Close other Arena tabs and try again.'));
    });
    return database;
  }

  return {
    async request(key, operation) {
      const db = await open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('gate', 'readwrite');
        let value;
        let failure;
        const request = transaction.objectStore('gate').get(key);
        request.onsuccess = () => {
          try { value = operation(); }
          catch (error) { failure = error; transaction.abort(); }
        };
        transaction.oncomplete = () => resolve(value);
        transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('Browser storage write was interrupted.'));
      });
    }
  };
}
