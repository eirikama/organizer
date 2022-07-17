<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
      </q-toolbar>
      <div class="q-px-lg q-pt-ql q-mb-md">
        <div class="text-h3">Familie M</div>
        <div class="text-subtitle1">{{ todaysDate }}</div>
      </div>
      <q-img src="../assets/mountains.jpg" class="header-image absolute-top" />
    </q-header>

    <q-footer class="bg-white" bordered>
      <!--
      <div v-if="notificationsSupported" class="banner-container bg-primary">
        <div class="constrain">
          <q-banner inline-actions class="bg-primary dense text-white">
            <template v-slot:avatar>
              <q-avatar
                color="white"
                text-color="primary"
                icon="eva-email-online"
              />
            </template>
            <b> Tillate Push-meldinger? </b>
            <template v-slot:action>
              <q-btn @click="enableNotifications" flat label="Ja" />
              <q-btn flat label="Später" />
              <q-btn flat label="Niemals" />
            </template>
          </q-banner>
        </div>
      </div>
-->

      <div v-if="showAppInstallBanner" class="banner-container bg-primary">
        <div class="constrain">
          <q-banner inline-actions class="bg-primary dense text-white">
            <template v-slot:avatar>
              <q-avatar
                color="white"
                text-color="primary"
                icon="eva-list-online"
              />
            </template>
            <b> Installere? </b>
            <template v-slot:action>
              <q-btn @click="installApp" flat label="Ja" />
              <q-btn flat label="Später" />
              <q-btn flat label="Niemals" />
            </template>
          </q-banner>
        </div>
      </div>
    </q-footer>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="200"
      :breakpoint="700"
    >
      <q-scroll-area
        style="
          height: calc(100% - 144px);
          margin-top: 144px;
          border-right: 1px solid #ddd;
        "
      >
        <q-list padding>
          <q-item to="/" exact clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="list" />
            </q-item-section>

            <q-item-section> Gjøremål </q-item-section>
          </q-item>

          <q-item to="/buys" exact clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="list" />
            </q-item-section>

            <q-item-section> Innkjøp </q-item-section>
          </q-item>

          <q-item to="/help" exact clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="help" />
            </q-item-section>
<!--
            <q-item-section> Familien </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>

-->
      <q-img
        class="absolute-top"
        src="../assets/mountains.jpg"
        style="height: 144px"
      >
        <div class="absolute-bottom bg-transparent">
          <q-avatar size="56px" class="q-mb-sm">
            <img src="../assets/fam_M.jpg" />
          </q-avatar>
          <div class="text-weight-bold">Eirik Almklov</div>
          <div>@almklov</div>
        </div>
      </q-img>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script>
import { date } from "quasar";

/*import { ref, defineComponent } from "vue";*/

let qs = require("qs");
let deferredPrompt;
let reg;

/*export default defineComponent({*/
export default {
  name: "MainLayout",

  data() {
    return {
      showAppInstallBanner: false,
      leftDrawerOpen: false,
    };
  },

  computed: {
    todaysDate() {
      let timeStamp = Date.now();
      return date.formatDate(timeStamp, "dddd D MMMM");
    },
    notificationsSupported() {
      if ("PushManager" in window) return true;
      return false;
    },
    ServiceWorkerSupported() {
      if ("serviceWorker" in navigator) return true;
      return false;
    },
  },

  methods: {
    toggleLeftDrawer() {
      this.leftDrawerOpen = !this.leftDrawerOpen;
    },

    installApp() {
      this.showAppInstallBanner = false;
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome == "accepted") {
          console.log("User accept installation");
        } else {
          console.log("User doesn't accept installation");
        }
      });
    },

    enableNotifications() {
      if (this.notificationsSupported) {
        Notification.requestPermission((result) => {
          if (result == "granted") {
            this.checkForExistingPushSubscription();
          }
        });
      }
    },

    checkForExistingPushSubscription() {
      if (this.ServiceWorkerSupported && this.notificationsSupported) {
        navigator.serviceWorker.ready
          .then((swreg) => {
            reg = swreg;
            return swreg.pushManager.getSubscription();
          })
          .then((sub) => {
            if (!sub) this.createPushSubscription();
          });
      }
    },

    createPushSubscription() {
      let vapidPublicKey =
        "BIBHTgWZ2w8Yh4T_N7oj0LNh6Exj0huq5EhjlxU_mI5WXzUp2vTl9_9BoTlOqW2Zj8oNDcvKjGk6Nb-m4jnO7So";
      let vapidPublicKeyConverted = this.urlBase64ToUint8Array(vapidPublicKey);
      reg.pushManager
        .subscribe({
          applicationServerKey: vapidPublicKeyConverted,
          userVisibleOnly: true,
        })
        .then((newSub) => {
          let newSubJSON = newSub.toJSON();
          let newSubJSONQueryString = qs.stringify(newSubJSON);
          this.$axios
            .post(
              `${process.env.API}/createSubscription?${newSubJSONQueryString}`
            )
            .then((response) => {
              this.displaySubscribedNotification();
              console.log("response: ", response);
            })
            .catch((error) => {
              console.log("error: ", error);
            });
        });
    },

    displaySubscribedNotification() {
      reg.showNotification("Du vil få push-meldinger!");
    },

    urlBase64ToUint8Array(base64String) {
      var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      var base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

      var rawData = window.atob(base64);
      var outputArray = new Uint8Array(rawData.length);

      for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    },
  },

  mounted() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showAppInstallBanner = true;
    });
  },
};
</script>

<style lang="scss">
.header-image {
  height: 100%;
  z-index: -1;
  opacity: 0.2;
  filter: grayscale(100%);
}
</style>
