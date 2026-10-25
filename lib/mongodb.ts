import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || "english_practice";

declare global {
  // eslint-disable-next-line no-var
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getDatabase(): Promise<Db> {
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Copy .env.example to .env.local and add your MongoDB connection string.");
  }

  if (!global.mongoClientPromise) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    global.mongoClientPromise = client.connect().catch((error: unknown) => {
      global.mongoClientPromise = undefined;
      throw error;
    });
  }

  return (await global.mongoClientPromise).db(databaseName);
}
