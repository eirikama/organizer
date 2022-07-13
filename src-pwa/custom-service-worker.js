/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.conf > pwa > workboxPluginMode is set to "InjectManifest"
 */

/*
 dependencies
*/

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";
import { Queue } from "workbox-background-sync";

/*
 config
*/

// Use with precache injection
precacheAndRoute(self.__WB_MANIFEST);

/* 
 caching strategies 
*/

registerRoute(
  ({ url }) => url.pathname.startsWith("/tasks"),
  new NetworkFirst()
);

registerRoute(
  ({ url }) => url.pathname.startsWith("/buys"),
  new NetworkFirst()
);

/*
  queue - createTask
*/

const createTaskQueue = new Queue("createTaskQueue");
const createBuyQueue = new Queue("createBuyQueue");

/*
  events - fetch
*/

self.addEventListener("fetch", (event) => {
  if (event.request.url.startsWith(`${process.env.API}/createBuy`)) {
    if (!self.navigator.onLine) {
      const promiseChain = fetch(event.request.clone()).catch((err) => {
        return createBuyQueue.pushRequest({ request: event.request });
      });

      event.waitUntil(promiseChain);
    }
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.startsWith(`${process.env.API}/createTask`)) {
    if (!self.navigator.onLine) {
      const promiseChain = fetch(event.request.clone()).catch((err) => {
        return createTaskQueue.pushRequest({ request: event.request });
      });

      event.waitUntil(promiseChain);
    }
  }
});

/*
  events - push
*/

self.addEventListener("push", (event) => {
  console.log("Push recieved: ", event);
  if (event.data) {
    let data = JSON.parse(event.data.text());
    event.waitUntil(self.registration.showNotification(data.title));
  }
});

/* events - notification click
 */

self.addEventListener("notificationclick", (event) => {
  event.waitUntil(
    clients.matchAll().then((clis) => {
      let clientUsingApp = clis.find((cli) => {
        return cli.visibilityState === "visible";
      });
      if (clientUsingApp) {
        clientUsingApp.navigate("/#/");
        clientUsingApp.focus();
      } else {
        clients.openWindow("/#/");
      }
    })
  );
});
