import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function simpleTest() {
  try {
    console.log('🔄 Testing basic MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // List databases
    const dbs = await mongoose.connection.db.admin().listDatabases();
    console.log('✅ Available databases:', dbs.databases.map(db => db.name));
    
    // Try to access our database
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('✅ Collections in wedding-timeline:', collections.map(c => c.name));
    
    await mongoose.connection.close();
    console.log('✅ Simple test completed successfully');
  } catch (error) {
    console.error('❌ Simple test failed:', error.message);
    if (error.code) console.error('Error code:', error.code);
    process.exit(1);
  }
}

simpleTest();
