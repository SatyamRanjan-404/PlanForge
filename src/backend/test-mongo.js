require('dotenv').config({ path: '../../.env' }); // Adjust path to point to root .env
const mongoose = require('mongoose');

// Fallback to local .env if root is not reached
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: '../.env' });
}

async function testMongoConnection() {
    console.log('Testing connection to:', process.env.MONGODB_URI ? process.env.MONGODB_URI.split('@')[1] || process.env.MONGODB_URI : 'UNDEFINED');
    
    if (!process.env.MONGODB_URI) {
        console.error('FAIL: MONGODB_URI is not defined in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('SUCCESS: Connected to MongoDB cluster!');

        // Define a temporary schema
        const TestSchema = new mongoose.Schema({ name: String, createdAt: Date });
        const TestModel = mongoose.model('TestCollection', TestSchema);

        // Insert
        const doc = new TestModel({ name: 'Verification Doc', createdAt: new Date() });
        await doc.save();
        console.log(`SUCCESS: Inserted document with ID: ${doc._id}`);

        // Read back
        const result = await TestModel.findById(doc._id);
        console.log(`SUCCESS: Retrieved document: ${result.name}`);

        // Cleanup
        await TestModel.findByIdAndDelete(doc._id);
        console.log('SUCCESS: Cleaned up test document.');

    } catch (err) {
        console.error('FAIL:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

testMongoConnection();
