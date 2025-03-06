import { debug } from "console";
import { MongoClient } from "mongodb";

// Debug helper
//const debug = (message: string, data?: any) => {
//  console.log(`[MongoDB] ${message}`, data ? data : "");
//};

// Check for MongoDB URI
if (!process.env.MONGODB_URI) {
  console.error('Missing environment variable: "MONGODB_URI"');
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
//debug("MongoDB URI configured", { uri: uri.substring(0, 15) + "..." });

// MongoDB connection options
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  //debug("Running in development mode");
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    //debug("Creating new MongoDB client (development)");
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client
      .connect()
      .then((client) => {
        //debug("MongoDB connected successfully (development)");
        return client;
      })
      .catch((err) => {
        console.error("MongoDB connection error (development):", err);
        throw err;
      });
  } else {
    //debug("Reusing existing MongoDB client (development)");
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  //debug("Running in production mode");
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client
    .connect()
    .then((client) => {
      //debug("MongoDB connected successfully (production)");
      return client;
    })
    .catch((err) => {
      console.error("MongoDB connection error (production):", err);
      throw err;
    });
}

// Test the connection
//clientPromise
//  .then(() => debug("MongoDB connection test successful"))
//  .catch((err) => console.error("MongoDB connection test failed:", err));

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
