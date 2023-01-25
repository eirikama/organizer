<template>
  <q-page class="bg-grey-4 column">
    <div class="row q-pa-sm bg-primary">
      <q-input
        v-model="newTask"
        @keyup.enter="addTask"
        class="col"
        square
        filled
        bg-color="white"
        placeholder="Legg til gjøremål"
        dense
      >
        <template v-slot:append>
          <q-btn @click="addTask" round dense flat icon="add" />
        </template>
      </q-input>
    </div>
    <div class="row q-pb-sm q-pr-sm q-pl-sm q-pt-none q-gutter-sm bg-primary">
      <q-btn
        @click="deleteAllTasks"
        size="sm"
        color="red-4"
        label="slett alle gjøremål"
      />
      <q-space />
      <q-btn
        @click="notDoneTasksFirst"
        size="sm"
        color="teal-3"
        label="ugjort først"
      />
      <q-btn
        @click="chronologicalTasks"
        size="sm"
        color="teal-4"
        label="kronologisk"
      />
    </div>

    <q-list class="bg-white" separator bordered>
      <q-item
        v-for="(task, index) in tasks"
        :key="task.id"
        @click="
          task.done = !task.done;
          updateDoneTask(index);
        "
        :class="{ 'done bg-blue-1': task.done }"
        clickable
        v-ripple
      >
        <q-item-section avatar>
          <q-checkbox
            v-model="task.done"
            class="no-pointer-events"
            color="primary"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ task.title }}</q-item-label>
        </q-item-section>
        <q-item-section v-if="task.done" side>
          <q-btn
            @click.stop="deleteTask(index)"
            flat
            dense
            round
            color="primary"
            icon="delete"
          />
        </q-item-section>
      </q-item>
    </q-list>
    <div v-if="!tasks.length" class="no-tasks absolute-center">
      <q-icon name="check" size="100px" color="primary" />
      <div class="text-h5 text-primary text-center">Alt er gjort</div>
    </div>
  </q-page>
</template>

<script>
var qs = require("qs");
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      newTask: "",
      tasks: [],
    };
  },
  methods: {
    getTasks() {
      this.$q.loading.show();
      this.$axios.get(`${process.env.API}/tasks`).then((response) => {
        this.tasks = response.data;
        this.$q.loading.hide();
      });
    },

    notDoneTasksFirst() {
      this.tasks = this.tasks.sort((a, b) => a.done - b.done);
    },

    chronologicalTasks() {
      this.tasks = this.tasks.sort((a, b) => a.id - b.id);
    },

    deleteAllTasks() {
      this.$q
        .dialog({
          title: "Confirm",
          message: "Vil du virkelig slette alle gjøremålene?",
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          this.tasks = [];
          this.$axios
            .post(`${process.env.API}/deleteAllTasks?$`)
            .catch((err) => {
              throw new Error("Error: ", err);
            });
          this.$q.notify("Gjøremålene slettet");
        });
    },

    deleteTask(index) {
      this.$q
        .dialog({
          title: "Confirm",
          message: "Vil du virkelig slette gjøremål?",
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          let taskQS = qs.stringify(this.tasks.at(index));
          this.tasks.splice(index, 1);
          this.$axios
            .post(`${process.env.API}/deleteTask?${taskQS}`)
            .catch((err) => {
              throw new Error("Error: ", err);
            });
          this.$q.notify("Gjøremål slettet");
        });
    },

    updateDoneTask(index) {
      let taskQS = qs.stringify(this.tasks.at(index));
      this.$axios
        .post(`${process.env.API}/updateDoneTask?${taskQS}`)
        .catch((err) => {
          throw new Error("Error: ", err);
        });
    },

    addTask() {
      this.$q.loading.show();
      let newTask = {
        id: Date.now(),
        title: this.newTask,
        done: false,
      };
      let newTaskQS = qs.stringify(newTask);
      this.$axios
        .post(`${process.env.API}/createTask?${newTaskQS}`)
        .then((_) => {
          this.tasks.push(newTask);
        })
        .catch((err) => {
          if (!navigator.onLine) {
            this.$q.notify("Ett gjøremål ble lagt til offline");
            this.$q.loading.hide();
            throw new Error("Error: ", err);
          }
        });
      this.$q.loading.hide();
      this.newTask = "";
    },
  },

  created() {
    this.getTasks();
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
