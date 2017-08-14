# skip-waiting-experiment

What happens when a new version of a service worker runs `skipWaiting()`? Specifically, what happens if the incumbent version is in the middle of an operation?

## Hypothesis

According to the spec, [skipWaiting](https://www.w3.org/TR/service-workers-1/#service-worker-global-scope-skipwaiting) runs the [Activate algorithm](https://www.w3.org/TR/service-workers-1/#activation-algorithm), which executes the following action before updating the active service worker:

> Wait for redundantWorker to finish handling any in-progress requests"

While it's not exactly explicit as to what "request" means here, we're going to test my hypothesis that this simply means any operation defined by the service worker primitives `waitUntil` and `respondWith`.

## Setup

I've created a simple `index.html` page that registers a service worker, `sw.js`. The web page shows any messages sent from the service worker (console.log support in service workers is not great in Chrome).

Every time `sw.js` is requested, the server brands the file with a different ID. In practice, this means that every time you visit the app, there's a new version of the service worker being installed.

Installation will cache a single asset, `asset.js`.

`/` will serve the index.html file.

I've created three routes that the service worker will intercept:

1. `/slow` will respond with `asset.js` after 10 seconds, using `respondWith`, and also send a message.
2. `/wait` will respond immediately with `asset.js`, but will use `waitUntil` to extend the event for 10 seconds before sending a message.
3. `/settimeout` will respond immediately with `asset.js` and then send a message after 10 seconds using setTimeout, but not wrapped in a `waitUntil`.

For each route, we will load the route and then load `/` in another tab. I expect that for the first two routes, the service worker will first install, then after 10 seconds show the corresponding message from the old service worker, then immediately activate the new service worker. I expect that for the third route, the setTimeout will never complete and the new service worker will activate immediately.

## Results

### /slow

Results were as expected

```
Messages from service worker:

Registration succeeded
version ycxNf responded to /slow
Version SqMQy activated
Version hI6Co activated
```

Note that there are two activations because the service worker beacons messages to all open clients, so the `/` route receives the message for when the `/slow` tab finally responds and updates the service worker.

### /wait

Results were as expected

```
Messages from service worker:

Registration succeeded
version 6XhGC done waiting for /wait
Version ycxNf activated
```

### /settimeout

Results were as expected. The message from `/settimeout` is never recieved.

```
Messages from service worker:

Registration succeeded
Version H3jV7 activated
```

## Conclusions

In order to gaurantee that `skipWaiting()` doesn't prematurely end the old service worker, ensure that all operations are properly scheduled using `waitUntil` and `respondWith`. This is general best practice anyways.

### Recomendations for the spec writers

It might be helpful to explicitly call out what "Wait for redundantWorker to finish handling any in-progress requests" means.