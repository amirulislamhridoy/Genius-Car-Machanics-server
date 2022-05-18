const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var jwt = require("jsonwebtoken");

// hello word

// middleware
app.use(cors());
app.use(express.json()); // for body-parser

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jxxlc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(' ')[1];
//   console.log(process.env.ACCESS_KEY)
  jwt.verify(token, process.env.ACCESS_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    // console.log('decoded', decoded)
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("geniusCar").collection("Service");
    const orderCollection = client.db("geniusCar").collection("order");

    // require('crypto').randomBytes(64).toString('hex')
    // accessToken
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = await jwt.sign(user, process.env.ACCESS_KEY, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    // all services
    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });
    // single service
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });
    // add service
    app.post("/service", async (req, res) => {
      const service = req.body;
      const doc = service;
      const result = await serviceCollection.insertOne(doc);
      res.send(result);
    });
    // delete service
    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });

    // orderCollection
    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });
    app.get("/order", verifyJWT, async (req, res) => {
      const decoded = req.decoded.email;
      const email = req.query.email;
      if (decoded === email) {
        const query = { email };
        const cursor = orderCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
      }else{
          res.status(403).send({message: 'forbidden access'})
      }
    });
  } finally {}
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log("Listening on port", port);
});
