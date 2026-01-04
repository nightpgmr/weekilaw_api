const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs').promises;
const cron = require('node-cron');
const connectDB = require('./config/database');
const Lawyer = require('./models/Lawyer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB (with fallback to file-based mode)
let mongoConnected = false;
connectDB().then(() => {
    mongoConnected = true;
}).catch((err) => {
    console.warn('⚠️  MongoDB not available, falling back to file-based operations');
    console.warn('💡 To use MongoDB: Install and start MongoDB, then run: npm run import-lawyers');
});

// Helper function to add delay between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Validation helper
const validateLawyerRequest = (req, res) => {
    const { name, family, mobileNumber, licenseNumber } = req.body;

    if (!name || !family) {
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors: {
                name: !name ? ['The name field is required.'] : [],
                family: !family ? ['The family field is required.'] : []
            }
        });
    }

    if (!mobileNumber && !licenseNumber) {
        return res.status(422).json({
            success: false,
            message: 'Either mobile number or license number is required'
        });
    }

    return null; // Validation passed
};

// Lawyer Search API
app.post('/api/lawyers/fetch-lawyers-data', async (req, res) => {
    try {
        var lawyersDataArray = [
            {
                "title": "آثار مالی جرائم و چگونگی مطالبه ی ضرر و زیان - 1394/9/5- 6 ساعت",
                "proexperience": "52a74802-f581-42c4-8a5d-3c389283b2ed",
                "lawyers": [],
            },
            {
                "title": "ابطال آراء داوری در پرتو قوانین موجد حق  -1394/6/19- 6 ساعت",
                "proexperience": "fb71ab93-c4a5-48da-999a-2121d3ba5753",
                "lawyers": [],
            },
            {
                "title": "تشخیص نوعیت اراضی شهری",
                "proexperience": "6d0c9072-5e0d-4b1b-9e11-e69d1919f230",
                "lawyers": [],
            },
            {
                "title": "جایگاه دیوان عدالت اداری در نظام دادرسی - 1393/9/13- 6 ساعت",
                "proexperience": "5ee4f944-9b29-40ad-b801-af961feb1a19",
                "lawyers": [],
            },
            {
                "title": "جلسه ی اول دادرسی در دعاوی حقوقی، باید ها و نبایدها - 1393/10/4- 6 ساعت",
                "proexperience": "fbfe474a-addc-46c1-b959-7c096294bce3",
                "lawyers": [],
            },
            {
                "title": "جهات نقض دادنامه در دعاوی بین المللی - 1397/09/01 - 8 ساعت",
                "proexperience": "236c492f-a1f2-44a7-81f7-557d61144292",
                "lawyers": [],
            },
            {
                "title": "فسخ قرارداد و تعیین حق سرقفلی در قوانین روابط موجر و مستاجر مصوب سالهای 56 و 76 -1394/10/24- 6 ساعت",
                "proexperience": "925a2b62-5db9-40f1-8042-84997a7c12d6",
                "lawyers": [],
            },
            {
                "title": "قرارهای تامین در قانون آیین دادرسی کیفری  سال92- 1393/11/30  - 6 ساعت",
                "proexperience": "a6323b3a-0b79-436e-b122-3265ddb3b239",
                "lawyers": [],
            },
            {
                "title": "مسئولیت مدنی و جزائی مدیران در شرکت های تجاری",
                "proexperience": "6183811c-67c0-4785-88d9-42d48a568bd3",
                "lawyers": [],
            },
            {
                "title": "مسئولیت مدنی و کیفری ناشی از نقض حقوق دارنده علامت تجاری - 1396/04/22 - 8 ساعت",
                "proexperience": "7f2933e6-cb50-4c93-8145-af711cf6b6a3",
                "lawyers": [],
            },
            {
                "title": "وجوه تمایز و تشابه قولنامه و بیع نامه و تطبیق آن  با قانون پیش فروش آپارتمان ها - 1393/11/2- 6 ساعت",
                "proexperience": "8d97bb7a-3a7a-413a-81e4-2a2db799b9c8",
                "lawyers": [],
            }
        ];

        // Make request to external API with delay between calls
        for (let i = 0; i < lawyersDataArray.length; i++) {
            const lawyer = lawyersDataArray[i];

            var searchData = {
                name: '',
                family: '',
                licensenumber: '',
                mobileNumber: '',
                EName: '',
                ELName: '',
                address: '',
                gender: '',
                province: '',
                workstate: '',
                proexperience: lawyer.proexperience,
            };

            try {
                const response = await axios.post(
                    'https://search.icbar.org/App/Handler/Law.ashx?Method=mGetLawyers',
                    searchData,
                    {
                        timeout: 30000,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        httpsAgent: new (require('https').Agent)({
                            rejectUnauthorized: false // Disable SSL verification
                        })
                    }
                );

                if (response.status === 200) {
                    lawyer.lawyers = response.data;
                }
            } catch (error) {
                console.error(`Error fetching data for lawyer ${i}:`, error.message);
            }

            // Add delay between requests (except for the last one)
            if (i < lawyersDataArray.length - 1) {
                await delay(2000); // 2 second delay
            }
        }

        // Save the complete lawyersDataArray to file
        try {
            if(lawyersDataArray[0].lawyers.length > 0) {
                await fs.writeFile('./lawyers.json', JSON.stringify(lawyersDataArray, null, 2));
                console.log('Lawyers data saved to lawyers.json');
            } else {
                console.log('No lawyers data found');
            }
        } catch (fileError) {
            console.error('Error saving lawyers data to file:', fileError.message);
        } 

        return res.status(200).json({
            success: true,
            message: 'Lawyer data fetched and saved successfully',
            status_code: 200,
            total_records: lawyersDataArray.length
        });
    } catch (error) {
        console.error('Fetch lawyers data error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching lawyers data',
            error: error.message
        });
    }
});

app.post('/api/lawyers/fetch-lawyers-data-2', async (req, res) => {
    try {
        var lawyersDataArray = [
            {
                "workstate": "1",
                "lawyers": [],
            },
            {
                "workstate": "2",
                "lawyers": [],
            },
            {
                "workstate": "3",
                "lawyers": [],
            },
            {
                "workstate": "4",
                "lawyers": [],
            },
            {
                "workstate": "5",
                "lawyers": [],
            },
            {
                "workstate": "6",
                "lawyers": [],
            },
            {
                "workstate": "7",
                "lawyers": [],
            },
            {
                "workstate": "8",
                "lawyers": [],
            },
            {
                "workstate": "9",
                "lawyers": [],
            },
            {
                "workstate": "10",
                "lawyers": [],
            },
            {
                "workstate": "11",
                "lawyers": [],
            },
            {
                "workstate": "12",
                "lawyers": [],
            },
            {
                "workstate": "13",
                "lawyers": [],
            },
            {
                "workstate": "14",
                "lawyers": [],
            },
            {
                "workstate": "15",
                "lawyers": [],
            },
            {
                "workstate": "16",
                "lawyers": [],
            }
        ];

        // Make request to external API with delay between calls
        for (let i = 0; i < lawyersDataArray.length; i++) {
            const lawyer = lawyersDataArray[i];

            var searchData = {
                name: '',
                family: '',
                licensenumber: '',
                mobileNumber: '',
                EName: '',
                ELName: '',
                address: '',
                gender: '',
                province: '',
                workstate: lawyer.workstate,
                proexperience: '',
            };

            try {
                const response = await axios.post(
                    'https://search.icbar.org/App/Handler/Law.ashx?Method=mGetLawyers',
                    searchData,
                    {
                        timeout: 30000,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        httpsAgent: new (require('https').Agent)({
                            rejectUnauthorized: false // Disable SSL verification
                        })
                    }
                );

                if (response.status === 200) {
                    lawyer.lawyers = response.data;
                }
            } catch (error) {
                console.error(`Error fetching data for lawyer ${i}:`, error.message);
            }

            // Add delay between requests (except for the last one)
            if (i < lawyersDataArray.length - 1) {
                await delay(2000); // 2 second delay
            }
        }

        // Save the complete lawyersDataArray to file
        try {
            if(lawyersDataArray[0].lawyers.length > 0) {
                await fs.writeFile('./lawyers.json', JSON.stringify(lawyersDataArray, null, 2));
                console.log('Lawyers data saved to lawyers.json');
            } else {
                console.log('No lawyers data found');
            }
        } catch (fileError) {
            console.error('Error saving lawyers data to file:', fileError.message);
        } 

        return res.status(200).json({
            success: true,
            message: 'Lawyer data fetched and saved successfully',
            status_code: 200,
            total_records: lawyersDataArray.length
        });
    } catch (error) {
        console.error('Fetch lawyers data error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching lawyers data',
            error: error.message
        });
    }
});

// Function to convert Persian digits to English digits
function convertPersianToEnglishDigits(str) {
    if (!str) return str;

    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    let result = str;
    for (let i = 0; i < persianDigits.length; i++) {
        result = result.replace(new RegExp(persianDigits[i], 'g'), englishDigits[i]);
    }

    return result;
}

async function fetchLawyerData(licenseNumber, name, family) {
    try {
        const response = await axios.get(
            'https://search.icbar.org/Lawyer/' + licenseNumber + '/' + name + '_' + family,
            {
                timeout: 30000,
                headers: {
                    'Content-Type': 'text/html'
                },
                httpsAgent: new (require('https').Agent)({
                    rejectUnauthorized: false // Disable SSL verification
                })
            }
        );

        if (response.status === 200) {
            // Parse HTML to extract mobileNumber
            const cheerio = require('cheerio');
            const $ = cheerio.load(response.data);
            const mobileNumber = $('#mobileNumber').val() || $('#mobileNumber').attr('value') || '';

            return {
                mobileNumber: mobileNumber
            };
        }
    } catch (error) {
        console.error('Fetch lawyer data error:', error.message);
        return null;
    }
}

async function fetchLawyersMobileNumber() {
    try{
        // Read lawyers data from local file
        let lawyersAllData = [];
        try {
            // Check if file exists, create it if not
            try {
                await fs.access('./lawyers.json');
            } catch (accessError) {
                // File doesn't exist, create it with empty array
                await fs.writeFile('./lawyers.json', '[]');
                console.log('Created new lawyers.json file');
            }

            const data = await fs.readFile('./lawyers.json', 'utf8');
            lawyersAllData = JSON.parse(data);
        } catch (fileError) {
            console.error('Error reading lawyers.json:', fileError.message);
            return res.status(500).json({
                success: false,
                message: 'Unable to read lawyers database',
                error: fileError.message
            });
        }

        for (const lawyersData of lawyersAllData) {
            if (lawyersData.lawyers && Array.isArray(lawyersData.lawyers)) {
                for (const lawyer of lawyersData.lawyers) {
                    if (!lawyer.mobileNumber || lawyer.mobileNumber === '') {
                        await delay(2000); // 2 second delay
                        const lawyerData = await fetchLawyerData(lawyer.licenseNumber, lawyer.name, lawyer.family);
                        if (lawyerData) {
                            lawyer.mobileNumber = convertPersianToEnglishDigits(lawyerData.mobileNumber);
                            console.log(lawyerData);
                        }
                    }
                }
            }
        }

        // Save the complete lawyersDataArray to file
        try {
            await fs.writeFile('./lawyers.json', JSON.stringify(lawyersDataArray, null, 2));
            console.log('Lawyers mobile number data saved to lawyers.json');
        } catch (fileError) {
            console.error('Error saving lawyers mobile number data to file:', fileError.message);
        }

    } catch (error) {
        console.error('Fetch lawyer data error:', error.message);
    }
}
// fetchLawyersMobileNumber();
// Schedule daily execution at midnight (00:00)
// cron.schedule('0 0 * * *', async () => {
//     console.log('🔄 Starting daily lawyer mobile number update...');
//     try {
//         await fetchLawyersMobileNumber();
//         console.log('✅ Daily lawyer mobile number update completed successfully');
//     } catch (error) {
//         console.error('❌ Error during daily lawyer mobile number update:', error.message);
//     }
// });

// Lawyer Search API (MongoDB with file fallback)
app.post('/api/lawyers/search', async (req, res) => {
    try {
        const { name, mobile, license_number, grade, address } = req.body;

        // Full MongoDB usage only (no file fallback)
        if (!mongoConnected) {
            return res.status(503).json({
                success: false,
                message: 'MongoDB not available - full MongoDB mode enabled',
                source: 'mongodb_required'
            });
        }

        let searchQuery = {};

        if (name) {
            searchQuery.name = { $regex: name, $options: 'i' }; // Case insensitive search
        }

        if (mobile) {
            searchQuery.mobile = mobile;
        }

        if (license_number) {
            searchQuery.license_number = license_number;
        }

        if (grade) {
            searchQuery.grade = { $regex: grade, $options: 'i' };
        }

        if (address) {
            searchQuery.address = { $regex: address, $options: 'i' };
        }

        const lawyers = await Lawyer.find(searchQuery).limit(100);

        return res.json({
            success: true,
            data: lawyers,
            count: lawyers.length,
            message: `Found ${lawyers.length} matching lawyers`,
            source: 'mongodb_full'
        });

    } catch (error) {
        console.error('Lawyer search error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while searching for lawyers',
            error: error.message
        });
    }
});

// Lawyer Verification API (MongoDB with file fallback)
app.post('/api/lawyers/verify', async (req, res) => {
    try {
        const { name, mobile, license_number } = req.body;

        // Validation: require name and either mobile or license_number
        if (!name) {
            return res.status(422).json({
                verified: false,
                message: 'Validation failed',
                errors: {
                    name: ['The name field is required.']
                }
            });
        }

        if (!mobile && !license_number) {
            return res.status(422).json({
                verified: false,
                message: 'Either mobile number or license number is required'
            });
        }

        // Full MongoDB usage only (no file fallback)
        if (!mongoConnected) {
            return res.status(503).json({
                verified: false,
                message: 'MongoDB not available - full MongoDB mode enabled',
                source: 'mongodb_required'
            });
        }

        let verifyQuery = { name: { $regex: `^${name}$`, $options: 'i' } }; // Exact name match, case insensitive

        if (mobile && license_number) {
            // Verify with both mobile and license number
            verifyQuery.$or = [
                { mobile: mobile, license_number: license_number }
            ];
        } else if (mobile) {
            // Verify with name and mobile
            verifyQuery.mobile = mobile;
        } else if (license_number) {
            // Verify with name and license number
            verifyQuery.license_number = license_number;
        }

        const lawyer = await Lawyer.findOne(verifyQuery);

        const isVerified = !!lawyer;

        return res.json({
            verified: isVerified,
            message: isVerified ? 'Lawyer is verified' : 'Lawyer not found',
            data: isVerified ? {
                name: lawyer.name,
                license_number: lawyer.license_number,
                mobile: lawyer.mobile,
                grade: lawyer.grade
            } : null,
            source: 'mongodb_full'
        });

    } catch (error) {
        console.error('Lawyer verification error:', error.message);
        return res.status(500).json({
            verified: false,
            message: 'An error occurred during verification',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== API V1 ENDPOINTS (LAWYERS.JSON - FILE-BASED) ====================

// V1 - Count lawyers in MongoDB (imported from lawyers.json)
app.get('/api/v1/lawyers/count', async (req, res) => {
    try {
        if (!mongoConnected) {
            return res.status(503).json({
                success: false,
                message: 'MongoDB not available for v1 API',
                source: 'mongodb_required',
                version: 'v1'
            });
        }

        // Import mongoose and get/create model
        const mongoose = require('mongoose');

        let LawyerFromFile;
        try {
            LawyerFromFile = mongoose.model('LawyerFromFile');
        } catch (error) {
            const LawyerFromFileSchema = new mongoose.Schema({
                name: String,
                license_number: String,
                validity_date: String,
                phone: String,
                mobile: String,
                address: String,
                extraction_method: String,
                training_title: String,
                training_proexperience: String,
                training_record_id: Number
            }, { timestamps: true });
            LawyerFromFile = mongoose.model('LawyerFromFile', LawyerFromFileSchema);
        }
        const count = await LawyerFromFile.countDocuments();

        res.json({
            success: true,
            count: count,
            message: `Total lawyers from lawyers.json in MongoDB: ${count}`,
            source: 'mongodb_v1',
            version: 'v1',
            data_type: 'imported_lawyers'
        });

    } catch (error) {
        console.error('V1 MongoDB count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to count imported lawyers',
            error: error.message,
            source: 'mongodb_error',
            version: 'v1'
        });
    }
});

// V1 - Search training data (lawyers.json)
app.post('/api/v1/lawyers/search', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const { name, mobile, license_number, address } = req.body;

        const data = await fs.readFile('./lawyers.json', 'utf8');
        const trainingRecords = JSON.parse(data);

        // Search through training records
        let matchingRecords = trainingRecords.filter(record => {
            if (name && !record.title.toLowerCase().includes(name.toLowerCase())) {
                return false;
            }
            // Training records don't have individual lawyer search fields like mobile/license
            return true;
        });

        res.json({
            success: true,
            data: matchingRecords,
            count: matchingRecords.length,
            message: `Found ${matchingRecords.length} training records`,
            source: 'file_v1',
            version: 'v1',
            query: req.body
        });

    } catch (error) {
        console.error('V1 search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed for training data',
            error: error.message,
            source: 'file_error',
            version: 'v1'
        });
    }
});

// V1 - Get training data (lawyers.json)
app.post('/api/v1/lawyers/fetch-data', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const data = await fs.readFile('./lawyers.json', 'utf8');
        const trainingRecords = JSON.parse(data);

        res.json({
            success: true,
            data: trainingRecords,
            count: trainingRecords.length,
            message: `Retrieved ${trainingRecords.length} training records`,
            source: 'file_v1',
            version: 'v1'
        });

    } catch (error) {
        console.error('V1 fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch training data',
            error: error.message,
            source: 'file_error',
            version: 'v1'
        });
    }
});

// ==================== API V2 ENDPOINTS (LAWYERS2.JSON - MONGODB) ====================

// V2 - Search lawyers (MongoDB)
app.post('/api/v2/lawyers/search', async (req, res) => {
    try {
        if (!mongoConnected) {
            return res.status(503).json({
                success: false,
                message: 'MongoDB not available for v2 API',
                source: 'mongodb_required',
                version: 'v2'
            });
        }

        const { name, mobile, license_number, grade, address, limit = 100 } = req.body;

        // Build search query
        let query = {};
        if (name) query.name = new RegExp(name, 'i');
        if (mobile) query.mobile = new RegExp(mobile.replace(/\s+/g, ''), 'i');
        if (license_number) query.license_number = license_number.toString();
        if (grade) query.grade = new RegExp(grade, 'i');
        if (address) query.address = new RegExp(address, 'i');

        const lawyers = await Lawyer.find(query)
            .limit(parseInt(limit))
            .sort({ name: 1 });

        res.json({
            success: true,
            data: lawyers,
            count: lawyers.length,
            query: req.body,
            message: `Found ${lawyers.length} lawyers in v2 database`,
            source: 'mongodb_v2',
            version: 'v2'
        });

    } catch (error) {
        console.error('V2 search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed for v2 data',
            error: error.message,
            source: 'mongodb_error',
            version: 'v2'
        });
    }
});

// V2 - Verify lawyer (MongoDB)
app.post('/api/v2/lawyers/verify', async (req, res) => {
    try {
        if (!mongoConnected) {
            return res.status(503).json({
                success: false,
                message: 'MongoDB not available for v2 API',
                source: 'mongodb_required',
                version: 'v2'
            });
        }

        const { name, mobile, license_number } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Name is required',
                version: 'v2'
            });
        }

        if (!mobile && !license_number) {
            return res.status(400).json({
                success: false,
                message: 'Either mobile number or license number is required',
                version: 'v2'
            });
        }

        let query = { name: new RegExp(name, 'i') };
        if (mobile) query.mobile = new RegExp(mobile.replace(/\s+/g, ''), 'i');
        if (license_number) query.license_number = license_number.toString();

        const lawyer = await Lawyer.findOne(query);

        res.json({
            success: true,
            verified: !!lawyer,
            data: lawyer,
            message: lawyer ? 'Lawyer verified successfully in v2 database' : 'Lawyer not found in v2 database',
            source: 'mongodb_v2',
            version: 'v2'
        });

    } catch (error) {
        console.error('V2 verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed for v2 data',
            error: error.message,
            source: 'mongodb_error',
            version: 'v2'
        });
    }
});

// V2 - Count lawyers (MongoDB)
app.get('/api/v2/lawyers/count', async (req, res) => {
    try {
        if (!mongoConnected) {
            return res.status(503).json({
                success: false,
                message: 'MongoDB not available for v2 API',
                source: 'mongodb_required',
                version: 'v2'
            });
        }

        const count = await Lawyer.countDocuments();

        res.json({
            success: true,
            count: count,
            message: `Total lawyers in v2 database: ${count}`,
            source: 'mongodb_v2',
            version: 'v2'
        });

    } catch (error) {
        console.error('V2 count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get count for v2 data',
            error: error.message,
            source: 'mongodb_error',
            version: 'v2'
        });
    }
});

// V2 - Database statistics (MongoDB)
app.get('/api/v2/lawyers/stats', async (req, res) => {
    try {
        if (!mongoConnected) {
            return res.status(503).json({
                success: false,
                message: 'MongoDB not available for v2 API',
                source: 'mongodb_required',
                version: 'v2'
            });
        }

        const totalCount = await Lawyer.countDocuments();
        const gradeStats = await Lawyer.aggregate([
            { $group: { _id: '$grade', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                total_lawyers: totalCount,
                grades: gradeStats,
                database: 'MongoDB (lawyers2.json)',
                last_updated: new Date().toISOString()
            },
            source: 'mongodb_v2',
            version: 'v2'
        });

    } catch (error) {
        console.error('V2 stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics for v2 data',
            error: error.message,
            source: 'mongodb_error',
            version: 'v2'
        });
    }
});


// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Weekilaw API Server (Versioned APIs)',
        databases: ['MongoDB (lawyers2.json)', 'File-based (lawyers.json)'],
        api_versions: ['v1 (File-based)', 'v2 (MongoDB)'],
        endpoints: {
            // V1 APIs (MongoDB - imported from lawyers.json)
            'GET /api/v1/lawyers/count': 'Get lawyers count from lawyers.json (MongoDB)',
            'POST /api/v1/lawyers/search': 'Search training records (lawyers.json)',
            'POST /api/v1/lawyers/fetch-data': 'Get all training records (lawyers.json)',

            // V2 APIs (MongoDB - lawyers2.json)
            'POST /api/v2/lawyers/search': 'Search lawyers (lawyers2.json MongoDB)',
            'POST /api/v2/lawyers/verify': 'Verify lawyer (lawyers2.json MongoDB)',
            'GET /api/v2/lawyers/count': 'Get lawyers count (lawyers2.json)',
            'GET /api/v2/lawyers/stats': 'Get database statistics (lawyers2.json)',

            // Legacy APIs (for backward compatibility)
            'POST /api/lawyers/fetch-lawyers-data': 'Training data (file-based)',
            'POST /api/lawyers/fetch-lawyers-data-2': 'Work state data (file-based)',

            // System
            'GET /health': 'Health check'
        },
        scripts: {
            'npm run import-lawyers': 'Import lawyers2.json to MongoDB',
            'npm run import-lawyers-file': 'Import lawyers.json to MongoDB'
        },
        mongodb_status: mongoConnected ? 'Connected' : 'Disconnected',
        note: 'Full MongoDB mode - all search/verify operations require MongoDB connection'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Weekilaw API Server (Versioned APIs) running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API endpoints:`);
    console.log(`   V1 APIs (File-based - lawyers.json):`);
    console.log(`     GET  http://localhost:${PORT}/api/v1/lawyers/count`);
    console.log(`     POST http://localhost:${PORT}/api/v1/lawyers/search`);
    console.log(`     POST http://localhost:${PORT}/api/v1/lawyers/fetch-data`);
    console.log(`   V2 APIs (MongoDB - lawyers2.json):`);
    console.log(`     POST http://localhost:${PORT}/api/v2/lawyers/search`);
    console.log(`     POST http://localhost:${PORT}/api/v2/lawyers/verify`);
    console.log(`     GET  http://localhost:${PORT}/api/v2/lawyers/count`);
    console.log(`     GET  http://localhost:${PORT}/api/v2/lawyers/stats`);
    console.log(`   Legacy APIs:`);
    console.log(`     POST http://localhost:${PORT}/api/lawyers/fetch-lawyers-data`);
    console.log(`     POST http://localhost:${PORT}/api/lawyers/fetch-lawyers-data-2`);
    console.log(`📦 Databases: MongoDB (${mongoConnected ? 'Connected' : 'Disconnected'}) + File-based`);
    console.log(`🔧 Import scripts:`);
    console.log(`   npm run import-lawyers (lawyers2.json)`);
    console.log(`   npm run import-lawyers-file (lawyers.json)`);
});

module.exports = app;
