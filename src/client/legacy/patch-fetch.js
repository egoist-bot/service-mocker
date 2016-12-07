import {
  Defer,
} from '../../utils/';

import {
  LEGACY_CLIENT_ID,
} from '../../constants/';

function createFetchEvent(request) {
  let fetchEvt = {};

  try {
    fetchEvt = new Event('fetch', {
      bubbles: true,
    });
  } catch (e) {
    fetchEvt = document.createEvent('Event');
    fetchEvt.initEvent('fetch', true, false);
  }

  const deferred = new Defer();
  const fetch = self.fetch.origin || self.fetch;

  fetchEvt.request = request;
  fetchEvt.clientId = LEGACY_CLIENT_ID;
  fetchEvt.respondWith = (response) => {
    deferred.resolve(response);
  };

  setTimeout(() => {
    if (deferred.done) return;
    deferred.resolve(fetch(request));
  }, 300);

  return {
    event: fetchEvt,
    promise: deferred.promise,
  };
}

export function patchFetch() {
  const {
    fetch,
  } = self;

  if (!fetch) {
    throw new Error('fetch is required for legacy mode');
  }

  if (fetch.mockerPatched) {
    return;
  }

  self.fetch = function patchedFetch(input, init) {
    const request = new Request(input, init);
    const { event, promise } = createFetchEvent(request);

    self.dispatchEvent(event);

    return promise;
  };

  self.fetch.mockerPatched = true;
  self.fetch.origin = fetch;
}