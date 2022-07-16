<template>
  <q-page class="bg-grey-4 column">
    <div class="row q-pa-sm bg-primary">
      <q-input
        v-model="newBuy"
        @keyup.enter="addBuy"
        class="col"
        square
        filled
        bg-color="white"
        placeholder="Legg til innkjøp"
        dense
      >
        <template v-slot:append>
          <q-btn @click="addBuy" round dense flat icon="add" />
        </template>
      </q-input>
    </div>
    <q-list class="bg-white" separator bordered>
      <q-item
        v-for="(buy, index) in buys"
        :key="buy.title"
        @click="
          buy.done = !buy.done;
          updateDoneBuy(index);
        "
        :class="{ 'done bg-blue-1': buy.done }"
        clickable
        v-ripple
      >
        <q-item-section avatar>
          <q-checkbox
            v-model="buy.done"
            class="no-pointer-events"
            color="secondary"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ buy.title }}</q-item-label>
        </q-item-section>
        <q-item-section v-if="buy.done" side>
          <q-btn
            @click.stop="deleteBuy(index)"
            flat
            dense
            round
            color="primary"
            icon="delete"
          />
        </q-item-section>
      </q-item>
    </q-list>
    <div v-if="!buys.length" class="no-buys absolute-center">
      <q-icon name="check" size="100px" color="primary" />
      <div class="text-h5 text-primary text-center">Nichts einzukaufen</div>
    </div>
  </q-page>
</template>

<script>
var qs = require("qs");
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      newBuy: "",
      buys: [],
    };
  },
  methods: {
    getBuys() {
      this.$q.loading.show();
      this.$axios.get(`${process.env.API}/buys`).then((response) => {
        this.buys = response.data;
        this.$q.loading.hide();
      });
    },

    deleteBuy(index) {
      this.$q
        .dialog({
          title: "Confirm",
          message: "Vil du virkelig slette innkjøp?",
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          let buysQS = qs.stringify(this.buys.at(index));
          this.buys.splice(index, 1);
          this.$axios
            .post(`${process.env.API}/deleteBuy?${buysQS}`)
            .catch((err) => {
              throw new Error("PROBLEM: ", err);
            });
          this.$q.notify("Innkjøp slettet");
        });
    },

    updateDoneBuy(index) {
      let buyQS = qs.stringify(this.buys.at(index));
      this.$axios
        .post(`${process.env.API}/updateDoneBuy?${buyQS}`)
        .catch((err) => {
          throw new Error("Error: ", err);
        });
    },

    addBuy() {
      this.$q.loading.show();
      let newBuy = {
        id: Date.now(),
        title: this.newBuy,
        done: false,
      };
      let newBuyQS = qs.stringify(newBuy);
      this.$axios
        .post(`${process.env.API}/createBuy?${newBuyQS}`)
        .then((_) => {
          this.buys.push(newBuy);
        })
        .catch((error) => {
          if (!navigator.onLine) {
            this.$q.notify("Einkaüfe würde Offline hinzugefügt");
            this.$q.loading.hide();
          }
        });
      this.$q.loading.hide();
      this.newBuy = "";
    },
  },
  created() {
    this.getBuys();
  },
});
</script>

<style lang="scss">
.done {
  .q-item__label {
    text-decoration: line-through;
    color: #bbb;
  }
}
.no-tasks {
  opacity: 0.5;
}
</style>
