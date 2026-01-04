const fs = require('fs').promises;
const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Create a separate model for lawyers from file data
const LawyerFromFileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  grade: {
    type: String,
    index: true
  },
  license_number: {
    type: String,
    required: true,
    index: true
  },
  validity_date: {
    type: String,
    index: true
  },
  issue_date: {
    type: String
  },
  phone: {
    type: String,
    index: true
  },
  mobile: {
    type: String,
    index: true
  },
  address: {
    type: String,
    index: true
  },
  extraction_method: {
    type: String,
    default: 'file_data'
  },
  training_title: {
    type: String
  },
  training_proexperience: {
    type: String
  },
  training_record_id: {
    type: Number
  }
}, {
  timestamps: true
});

// Create indexes for better search performance
LawyerFromFileSchema.index({ name: 1, mobile: 1 });
LawyerFromFileSchema.index({ name: 1, license_number: 1 });
LawyerFromFileSchema.index({ mobile: 1, license_number: 1 });

const LawyerFromFile = mongoose.model('LawyerFromFile', LawyerFromFileSchema);

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

    console.log(`📊 Found ${allLawyers.length} total lawyers to import from lawyers.json (including duplicates)`);

    // Clear existing data from file imports
    await LawyerFromFile.deleteMany({});
    console.log('🗑️  Cleared existing lawyers.json data');

    // Insert ALL data one by one to handle duplicates gracefully
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < allLawyers.length; i++) {
      const lawyer = allLawyers[i];

      try {
        // Insert each lawyer into the separate collection
        await LawyerFromFile.create(lawyer);
        imported++;

        if (imported % 100 === 0) {
          console.log(`✅ Imported ${imported}/${allLawyers.length} lawyers from lawyers.json`);
        }

      } catch (error) {
        console.error(`❌ Error importing lawyer ${i + 1}:`, error.message);
        skipped++;
      }
    }

    console.log(`🎉 Successfully imported ${imported} lawyers from lawyers.json to MongoDB`);
    console.log(`⏭️  Skipped ${skipped} duplicate lawyers`);
    console.log(`📊 Total processed: ${allLawyers.length} lawyers`);

    // Create indexes for better performance
    console.log('🔍 Creating database indexes...');
    await LawyerFromFile.collection.createIndex({ name: 1, mobile: 1 });
    await LawyerFromFile.collection.createIndex({ name: 1, license_number: 1 });
    await LawyerFromFile.collection.createIndex({ mobile: 1, license_number: 1 });
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
