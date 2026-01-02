const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs').promises;
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

// Schedule daily execution at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Starting daily lawyer mobile number update...');
    try {
        await fetchLawyersMobileNumber();
        console.log('✅ Daily lawyer mobile number update completed successfully');
    } catch (error) {
        console.error('❌ Error during daily lawyer mobile number update:', error.message);
    }
});

// Lawyer Search API
app.post('/api/lawyers/search', async (req, res) => {
    try {
        // Validate request
        const validationError = validateLawyerRequest(req, res);
        if (validationError) return;

        const { name, family, mobileNumber, licenseNumber, EName, ELName, address, gender, province, workstate, proexperience } = req.body;

        // Read lawyers data from local file
        let lawyersData;
        try {
            const data = await fs.readFile('./lawyers.json', 'utf8');
            lawyersData = JSON.parse(data);
        } catch (fileError) {
            console.error('Error reading lawyers.json:', fileError.message);
            return res.status(500).json({
                success: false,
                message: 'Unable to read lawyers database',
                error: fileError.message
            });
        }

        // Search through lawyers data
        let matchingLawyers = [];

        for (const training of lawyersData) {
            if (training.lawyers && Array.isArray(training.lawyers)) {
                for (const lawyer of training.lawyers) {
                    let isMatch = true;

                    // Check name and family (required fields)
                    if (name && (!lawyer.name || lawyer.name.toLowerCase() !== name.toLowerCase())) {
                        isMatch = false;
                    }
                    if (family && (!lawyer.family || lawyer.family.toLowerCase() !== family.toLowerCase())) {
                        isMatch = false;
                    }

                    // Check optional fields
                    if (licenseNumber && lawyer.licenseNumber !== licenseNumber) {
                        isMatch = false;
                    }
                    if (mobileNumber && (!lawyer.mobileNumber || lawyer.mobileNumber !== mobileNumber)) {
                        isMatch = false;
                    }
                    if (EName && lawyer.englishName !== EName) {
                        isMatch = false;
                    }
                    if (ELName && lawyer.englishFamily !== ELName) {
                        isMatch = false;
                    }
                    if (address && lawyer.officeAddress !== address) {
                        isMatch = false;
                    }
                    if (gender && lawyer.sex !== gender) {
                        isMatch = false;
                    }
                    if (province && lawyer.LDBLawyer_To_BITGeoLocation_officeLocationId.locationName !== province) {
                        isMatch = false;
                    }
                    if (workstate && lawyer.workState !== workstate) {
                        isMatch = false;
                    }
                    if (proexperience && lawyer.proexperience !== proexperience) {
                        isMatch = false;
                    }

                    if (isMatch) {
                        // Add training context to the lawyer
                        matchingLawyers.push({
                            ...lawyer,
                            trainingTitle: training.title,
                            proexperience: training.proexperience
                        });
                    }
                }
            }
        }

        return res.json({
            success: true,
            data: matchingLawyers,
            count: matchingLawyers.length,
            message: `Found ${matchingLawyers.length} matching lawyers`
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

// Lawyer Verification API
app.post('/api/lawyers/verify', async (req, res) => {
    try {
        // Validate request
        const validationError = validateLawyerRequest(req, res);
        if (validationError) return;

        const { name, family, mobileNumber, licenseNumber, EName, ELName, address, gender, province, workstate, proexperience } = req.body;

        // Read lawyers data from local file
        let lawyersData;
        try {
            const data = await fs.readFile('./lawyers.json', 'utf8');
            lawyersData = JSON.parse(data);
        } catch (fileError) {
            console.error('Error reading lawyers.json:', fileError.message);
            return res.status(500).json({
                verified: false,
                message: 'Unable to read lawyers database',
                error: fileError.message
            });
        }

        // Search for exact match
        let isVerified = false;

        for (const training of lawyersData) {
            if (training.lawyers && Array.isArray(training.lawyers)) {
                for (const lawyer of training.lawyers) {
                    let isExactMatch = true;

                    // Check name and family (required fields - case insensitive)
                    if (name && (!lawyer.name || lawyer.name.toLowerCase() !== name.toLowerCase())) {
                        isExactMatch = false;
                    }
                    if (family && (!lawyer.family || lawyer.family.toLowerCase() !== family.toLowerCase())) {
                        isExactMatch = false;
                    }

                    // Check optional fields for exact match
                    if (licenseNumber && lawyer.licenseNumber !== licenseNumber) {
                        isExactMatch = false;
                    }
                    if (mobileNumber && lawyer.mobileNumber !== mobileNumber) {
                        isExactMatch = false;
                    }
                    if (EName && lawyer.englishName !== EName) {
                        isExactMatch = false;
                    }
                    if (ELName && lawyer.englishFamily !== ELName) {
                        isExactMatch = false;
                    }
                    if (address && lawyer.officeAddress !== address) {
                        isExactMatch = false;
                    }
                    if (gender && lawyer.sex !== gender) {
                        isExactMatch = false;
                    }
                    if (province && lawyer.LDBLawyer_To_BITGeoLocation_officeLocationId.locationName !== province) {
                        isExactMatch = false;
                    }
                    if (workstate && lawyer.workState !== workstate) {
                        isExactMatch = false;
                    }
                    if (proexperience && lawyer.proexperience !== proexperience) {
                        isExactMatch = false;
                    }

                    if (isExactMatch) {
                        isVerified = true;
                        break;
                    }
                }
                if (isVerified) break;
            }
        }

        return res.json({
            verified: isVerified,
            message: isVerified ? 'Lawyer is verified' : 'Lawyer not found',
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

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Weekilaw API Server',
        endpoints: {
            'POST /api/lawyers/search': 'Search for lawyers',
            'POST /api/lawyers/verify': 'Verify lawyer existence',
            'GET /health': 'Health check'
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
    console.log(`🚀 Weekilaw API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/lawyers/search`);
    console.log(`   POST http://localhost:${PORT}/api/lawyers/verify`);
});

module.exports = app;
