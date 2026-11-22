/* Private, browser-local gallery storage. No photos are uploaded. */
const PeachyGallery = (() => {
  const DB_NAME = 'peachy-photo-booth-gallery';
  const STORE = 'prints';
  function open() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('This browser does not support gallery storage.'));
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function operate(mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
      let result;
      let settled = false;
      function fail(err) { if (!settled) { settled = true; db.close(); reject(err || new Error('Gallery storage failed.')); } }
      let transaction;
      try {
        transaction = db.transaction(STORE, mode);
        const request = action(transaction.objectStore(STORE));
        request.onsuccess = () => { result = request.result; };
        request.onerror = () => fail(request.error);
        transaction.oncomplete = () => { if (!settled) { settled = true; db.close(); resolve(result); } };
        transaction.onabort = () => fail(transaction.error);
        transaction.onerror = () => fail(transaction.error);
      } catch (error) { fail(error); }
    });
  }
  const add = (print) => operate('readwrite', store => store.put(print));
  const all = async () => (await operate('readonly', store => store.getAll())).sort((a,b) => b.createdAt - a.createdAt);
  const remove = (id) => operate('readwrite', store => store.delete(id));
  const clear = () => operate('readwrite', store => store.clear());
  return { add, all, remove, clear };
})();
