const fs = require('fs').promises;
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Lawyer = require('../models/Lawyer');

const importLawyers = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    console.log('🔄 Starting lawyer data import...');

    // Read lawyers2.json file
    const lawyersData = await fs.readFile('./lawyers2.json', 'utf8');
    const lawyers = JSON.parse(lawyersData);

    console.log(`📊 Found ${lawyers.length} lawyers to import`);

    // Clear existing data
    await Lawyer.deleteMany({});
    console.log('🗑️  Cleared existing lawyer data');

    // Insert data in batches to avoid memory issues
    const batchSize = 1000;
    let imported = 0;

    for (let i = 0; i < lawyers.length; i += batchSize) {
      const batch = lawyers.slice(i, i + batchSize);

      try {
        await Lawyer.insertMany(batch, { ordered: false });
        imported += batch.length;
        console.log(`✅ Imported ${imported}/${lawyers.length} lawyers`);
      } catch (batchError) {
        console.error(`❌ Error importing batch ${Math.floor(i/batchSize) + 1}:`, batchError.message);
        // Continue with next batch even if one fails
      }
    }

    console.log(`🎉 Successfully imported ${imported} lawyers to MongoDB`);

    // Create indexes for better performance
    console.log('🔍 Creating database indexes...');
    await Lawyer.collection.createIndex({ name: 1, mobile: 1 });
    await Lawyer.collection.createIndex({ name: 1, license_number: 1 });
    await Lawyer.collection.createIndex({ mobile: 1, license_number: 1 });
    console.log('✅ Indexes created successfully');

  } catch (error) {
    console.error('❌ Import error:', error.message);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the import if this script is executed directly
if (require.main === module) {
  importLawyers();
}

module.exports = importLawyers;
