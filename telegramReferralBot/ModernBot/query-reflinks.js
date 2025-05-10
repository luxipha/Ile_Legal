const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function queryRefLinks() {
    const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(process.env.MONGODB_DATABASE_NAME);
        const reflinks = await db.collection('reflinks').find({}).toArray();
        
        console.log(`Found ${reflinks.length} referral links:`);
        console.log(JSON.stringify(reflinks, null, 2));
        
        reflinks.forEach(link => {
            // Print all properties to see what's available
            console.log(`Link: ${JSON.stringify(link)}`);
        });
        
    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await client.close();
    }
}

queryRefLinks();
