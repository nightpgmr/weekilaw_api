const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
app.post('/api/lawyers/search', async (req, res) => {
    try {
        // Validate request
        const validationError = validateLawyerRequest(req, res);
        if (validationError) return;

        const { name, family, mobileNumber, licenseNumber, EName, ELName, address, gender, province, workstate, proexperience } = req.body;

        // Prepare search data
        const searchData = {
            name,
            family,
            licensenumber: licenseNumber || '',
            mobileNumber: mobileNumber || '',
            EName: EName || '',
            ELName: ELName || '',
            address: address || '',
            gender: gender || '',
            province: province || '',
            workstate: workstate || '',
            proexperience: proexperience || ''
        };

        // Make request to external API
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
            return res.json({
                success: true,
                data: response.data,
                message: 'Lawyer search completed successfully'
            });
        } else {
            return res.status(response.status).json({
                success: false,
                message: 'External API request failed',
                status_code: response.status
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

// Lawyer Verification API
app.post('/api/lawyers/verify', async (req, res) => {
    try {
        // Validate request
        const validationError = validateLawyerRequest(req, res);
        if (validationError) return;

        const { name, family, mobileNumber, licenseNumber, EName, ELName, address, gender, province, workstate, proexperience } = req.body;

        // Prepare search data
        const searchData = {
            name,
            family,
            licensenumber: licenseNumber || '',
            mobileNumber: mobileNumber || '',
            EName: EName || '',
            ELName: ELName || '',
            address: address || '',
            gender: gender || '',
            province: province || '',
            workstate: workstate || '',
            proexperience: proexperience || ''
        };

        // Make request to external API
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
            const data = response.data;
            const isVerified = data && Array.isArray(data) && data.length > 0;

            return res.json({
                verified: isVerified,
                message: isVerified ? 'Lawyer is verified' : 'Lawyer not found'
            });
        } else {
            return res.status(response.status).json({
                verified: false,
                message: 'External API request failed'
            });
        }

    } catch (error) {
        console.error('Lawyer verification error:', error.message);
        return res.status(500).json({
            verified: false,
            message: 'An error occurred while verifying lawyer'
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
