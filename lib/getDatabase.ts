import { MongoClient } from "mongodb";

export default async function getDatabase(){
    const client = new MongoClient(process.env.MONGO_KEY+'')
    await client.connect();
    const db = client.db();
    
    return {client, db};
}
