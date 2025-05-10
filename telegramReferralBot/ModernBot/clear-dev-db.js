const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function clearDevDatabase() {
    const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(process.env.MONGODB_DATABASE_NAME);
        
        // Collections to clear
        const collections = ['users', 'referrals', 'referralLinks', 'activities'];
        
        for (const collection of collections) {
            const result = await db.collection(collection).deleteMany({});
            console.log(`Cleared ${result.deletedCount} documents from ${collection}`);
        }
        
        console.log('Development database cleared successfully');
    } catch (error) {
        console.error('Error clearing database:', error);
    } finally {
        await client.close();
    }
}

clearDevDatabase();
