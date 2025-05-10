const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function deleteRefLinks() {
    const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(process.env.MONGODB_DATABASE_NAME);
        
        // Delete all existing referral links
        const result = await db.collection('reflinks').deleteMany({});
        console.log(`Deleted ${result.deletedCount} referral links`);
        
    } catch (error) {
        console.error('Error deleting referral links:', error);
    } finally {
        await client.close();
    }
}

deleteRefLinks();
