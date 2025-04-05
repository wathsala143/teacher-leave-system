const mongoose = require('mongoose');

const uri = "mongodb://DatabaseAccess:<db_password>@ac-kc255gh-shard-00-00.izgieej.mongodb.net:27017,ac-kc255gh-shard-00-01.izgieej.mongodb.net:27017,ac-kc255gh-shard-00-02.izgieej.mongodb.net:27017/<dbname>?replicaSet=atlas-ub90fh-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));
console.log("MONGODB_URI:", process.env.MONGODB_URI);

