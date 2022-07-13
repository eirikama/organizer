/*
  dependencies
*/

const express = require("express");
let admin = require("firebase-admin");
let webpush = require("web-push");

/*
  config - express
*/

const app = express();

/*
  config - firebase
*/

let serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

let db = admin.firestore();

/*
  config - web push
*/

webpush.setVapidDetails(
  "mailto:rickyrwanda@gmail.com",
  "BIBHTgWZ2w8Yh4T_N7oj0LNh6Exj0huq5EhjlxU_mI5WXzUp2vTl9_9BoTlOqW2Zj8oNDcvKjGk6Nb-m4jnO7So",
  "onsyIV8Agb4vzTOROlDgxhimO4IDqVLlRdW45kbFLuI"
);

/*
  endpoint - buys
*/

app.get("/buys", (request, response) => {
  response.set("Access-Control-Allow-Origin", "*");

  let tasks = [];
  db.collection("buys")
    .orderBy("id", "asc")
    .get()
    .then((snapshot) => {
      snapshot.docs.forEach((doc) => {
        tasks.push(doc.data());
      });
      response.send(tasks);
    });
});

/*
  endpoint - createBuy
*/

app.post("/createBuy", (request, response) => {
  response.set("Access-Control-Allow-Origin", "*");
  request.query.id = parseInt(request.query.id);
  request.query.done = !Boolean(request.query.done);
  db.collection("buys")
    .add(request.query)
    .then((docRef) => {
      sendPushNotification();
      response.send(request.query);
    });
});

/*
  endpoint - deleteBuy
*/

app.post("/deleteBuy", (request, response) => {
  response.set("Access-Control-Allow-Origin", "*");
  request.query.id = parseInt(request.query.id);
  db.collection("buys")
    .where("id", "==", request.query.id)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        db.collection("buys").doc(doc.id).delete();
      });
    })
    .catch((error) => {});
});

/*
  endpoint - tasks
*/

app.get("/tasks", (request, response) => {
  response.set("Access-Control-Allow-Origin", "*");

  let tasks = [];
  db.collection("tasks")
    .orderBy("id", "asc")
    .get()
    .then((snapshot) => {
      snapshot.docs.forEach((doc) => {
        tasks.push(doc.data());
      });
      response.send(tasks);
    });
});

/*
  endpoint - createTask
*/

app.post("/createTask", (request, response) => {
  response.set("Access-Control-Allow-Origin", "*");
  request.query.id = parseInt(request.query.id);
  request.query.done = !Boolean(request.query.done);
  db.collection("tasks")
    .add(request.query)
    .then((docRef) => {
      sendPushNotification();
      response.send(request.query);
    });
});

function sendPushNotification() {
  let subscriptions = [];
  db.collection("subscriptions")
    .get()
    .then((snapshot) => {
      snapshot.docs.forEach((doc) => {
        subscriptions.push(doc.data());
      });
      return subscriptions;
    })
    .then((subscriptions) => {
      subscriptions.forEach((subscription) => {
        let pushConfig = {
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.keys.auth,
            p256dh: subscription.keys.p256dh,
          },
        };
        let pushContent = {
          title: "Neues hinzugefügt",
        };
        webpush.sendNotification(pushConfig, JSON.stringify(pushContent));
      });
    });
}

/*
  endpoint - deleteTast
*/

app.post("/deleteTask", (request, response) => {
  response.set("Access-Control-Allow-Origin", "*");
  request.query.id = parseInt(request.query.id);
  db.collection("tasks")
    .where("id", "==", request.query.id)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        db.collection("tasks").doc(doc.id).delete();
      });
    })
    .catch((error) => {
      console.log("Error deleting documents: ", error);
    });
  //response.send(request.query);
});

/*
  update done task 
*/

app.post("/updateDoneTask", (request, response) => {
  response.set("Access-Control-Allow-Origin", "*");
  request.query.id = parseInt(request.query.id);
  db.collection("tasks")
    .where("id", "==", request.query.id)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        request.query.done = eval(request.query.done);
        db.collection("tasks").doc(doc.id).update({ done: request.query.done });
      });
    })
    .then((_) => {})
    .catch((error) => {
      console.log(error);
    });
});

/*
  update done buy
*/

app.post("/updateDoneBuy", (request, response) => {
  response.set("Access-Control-Allow-Origin", "*");
  request.query.id = parseInt(request.query.id);
  db.collection("buys")
    .where("id", "==", request.query.id)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        request.query.done = eval(request.query.done);
        db.collection("buys").doc(doc.id).update({ done: request.query.done });
      });
    })
    .then((_) => {})
    .catch((error) => {
      console.log(error);
    });
});

/*
 create subscription
*/

app.post("/createSubscription", (request, response) => {
  response.set("Access-Control-Allow-Origin", "*");
  db.collection("subscriptions")
    .add(request.query)
    .then((docRef) => {
      response.send({
        message: "Subscription added!",
        data: request.query,
      });
    });
});

/*
  listen
*/

//app.listen(3000);
app.listen(process.env.PORT || 3000);
