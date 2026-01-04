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

        if (mongoConnected) {
            // MongoDB search
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
                source: 'mongodb'
            });
        } else {
            // File-based search fallback
            let lawyersData;
            try {
                const data = await fs.readFile('./lawyers2.json', 'utf8');
                lawyersData = JSON.parse(data);
            } catch (fileError) {
                console.error('Error reading lawyers2.json:', fileError.message);
                return res.status(500).json({
                    success: false,
                    message: 'Unable to read lawyers database',
                    error: fileError.message
                });
            }

            // Search through lawyers data
            let matchingLawyers = lawyersData.filter(lawyer => {
                let isMatch = true;

                if (name && !lawyer.name.toLowerCase().includes(name.toLowerCase())) {
                    isMatch = false;
                }

                if (mobile && lawyer.mobile !== mobile) {
                    isMatch = false;
                }

                if (license_number && lawyer.license_number !== license_number) {
                    isMatch = false;
                }

                if (grade && !lawyer.grade.toLowerCase().includes(grade.toLowerCase())) {
                    isMatch = false;
                }

                if (address && !lawyer.address.toLowerCase().includes(address.toLowerCase())) {
                    isMatch = false;
                }

                return isMatch;
            }).slice(0, 100); // Limit results

            return res.json({
                success: true,
                data: matchingLawyers,
                count: matchingLawyers.length,
                message: `Found ${matchingLawyers.length} matching lawyers`,
                source: 'file'
            });
        }

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

        if (mongoConnected) {
            // MongoDB verification
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
                source: 'mongodb'
            });
        } else {
            // File-based verification fallback
            let lawyersData;
            try {
                const data = await fs.readFile('./lawyers2.json', 'utf8');
                lawyersData = JSON.parse(data);
            } catch (fileError) {
                console.error('Error reading lawyers2.json:', fileError.message);
                return res.status(500).json({
                    verified: false,
                    message: 'Unable to read lawyers database',
                    error: fileError.message
                });
            }

            // Search for exact match
            let verifiedLawyer = null;

            for (const lawyer of lawyersData) {
                let isExactMatch = true;

                // Check name (exact match, case insensitive)
                if (name && (!lawyer.name || lawyer.name.toLowerCase() !== name.toLowerCase())) {
                    isExactMatch = false;
                }

                // Check mobile or license_number
                if (mobile && license_number) {
                    // Both provided - check both match
                    if (lawyer.mobile !== mobile || lawyer.license_number !== license_number) {
                        isExactMatch = false;
                    }
                } else if (mobile) {
                    // Only mobile provided
                    if (lawyer.mobile !== mobile) {
                        isExactMatch = false;
                    }
                } else if (license_number) {
                    // Only license_number provided
                    if (lawyer.license_number !== license_number) {
                        isExactMatch = false;
                    }
                }

                if (isExactMatch) {
                    verifiedLawyer = lawyer;
                    break;
                }
            }

            const isVerified = !!verifiedLawyer;

            return res.json({
                verified: isVerified,
                message: isVerified ? 'Lawyer is verified' : 'Lawyer not found',
                data: isVerified ? {
                    name: verifiedLawyer.name,
                    license_number: verifiedLawyer.license_number,
                    mobile: verifiedLawyer.mobile,
                    grade: verifiedLawyer.grade
                } : null,
                source: 'file'
            });
        }

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

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Weekilaw API Server (MongoDB)',
        database: 'MongoDB',
        endpoints: {
            'POST /api/lawyers/search': 'Search for lawyers (name, mobile, license_number, grade, address)',
            'POST /api/lawyers/verify': 'Verify lawyer with name and mobile or license number',
            'GET /health': 'Health check'
        },
        scripts: {
            'npm run import-lawyers': 'Import lawyers2.json data to MongoDB'
        }
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
    console.log(`🚀 Weekilaw API Server (MongoDB) running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/lawyers/search`);
    console.log(`   POST http://localhost:${PORT}/api/lawyers/verify`);
    console.log(`📦 Database: MongoDB`);
    console.log(`🔧 Import data: npm run import-lawyers`);
});

module.exports = app;
