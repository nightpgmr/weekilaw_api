const fs = require('fs').promises;
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Lawyer = require('../models/Lawyer');

const importLawyersFromTraining = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    console.log('🔄 Starting lawyer import from training data...');

    // Read lawyers.json file (training data)
    const trainingData = await fs.readFile('./lawyers.json', 'utf8');
    const trainingRecords = JSON.parse(trainingData);

    console.log(`📊 Found ${trainingRecords.length} training records`);

    // Extract ALL lawyers from training records (no deduplication)
    const allLawyers = [];

    trainingRecords.forEach((record, recordIndex) => {
      if (record.lawyers && Array.isArray(record.lawyers)) {
        record.lawyers.forEach((lawyer, lawyerIndex) => {
          // Transform training lawyer data to match our Lawyer schema
          const transformedLawyer = {
            name: `${lawyer.name || ''} ${lawyer.family || ''}`.trim(),
            license_number: lawyer.licenseNumber || '',
            validity_date: lawyer.endCreditLicenseDate || '',
            phone: '',
            mobile: '',
            address: lawyer.LDBLawyer_To_BITGeoLocation_officeLocationId?.FULLLOCATIONNAME || '',
            grade: '',
            issue_date: '',
            extraction_method: 'training_data',
            training_title: record.title || '',
            training_proexperience: record.proexperience || '',
            training_record_id: recordIndex + 1
          };

          allLawyers.push(transformedLawyer);
        });
      }
    });

    console.log(`📊 Found ${allLawyers.length} total lawyers to import from training data (including duplicates)`);

    // Clear existing data from training imports (optional)
    // await Lawyer.deleteMany({ extraction_method: 'training_data' });
    // console.log('🗑️  Cleared existing training data');

    // Insert ALL data in batches to avoid memory issues
    const batchSize = 100;
    let imported = 0;

    for (let i = 0; i < allLawyers.length; i += batchSize) {
      const batch = allLawyers.slice(i, i + batchSize);

      try {
        await Lawyer.insertMany(batch, { ordered: false });
        imported += batch.length;
        console.log(`✅ Imported ${imported}/${allLawyers.length} lawyers from training data`);

      } catch (batchError) {
        console.error(`❌ Error importing batch ${Math.floor(i/batchSize) + 1}:`, batchError.message);
        // Continue with next batch even if one fails
      }
    }

    console.log(`🎉 Successfully imported ALL ${imported} lawyers from training data to MongoDB`);

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
  importLawyersFromTraining();
}

module.exports = importLawyersFromTraining;
