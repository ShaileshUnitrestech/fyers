const express = require('express');
const fyersModel = require('fyers-api-v3').fyersModel;
const app = express();
const port = 8000;

// Middleware to parse JSON requests
app.use(express.json());

// Initialize Fyers API
const fyers = new fyersModel({
    path: "./", // Save logs in the current working directory
    enableLogging: true
});

// Set your App ID and Redirect URL
const APP_ID = process.env.APP_ID; 
const SECRET_KEY = process.env.SECRET_KEY; 
const REDIRECT_URL =  process.env.REDIRECT_URL; 

fyers.setAppId(APP_ID);
fyers.setRedirectUrl(REDIRECT_URL);

// Step 1: Generate Auth Code URL
app.get('/generate-auth-url', (req, res) => {
    const authUrl = fyers.generateAuthCode();
    res.json({ url: authUrl });
});

// Step 2: Handle the callback and exchange auth code for access token
app.get('/callback', (req, res) => {
    const authCode = req.query.auth_code;

    if (!authCode) {
        return res.status(400).json({ message: "Auth code not found in callback" });
    }

    fyers.generate_access_token({
        client_id: APP_ID,
        secret_key: SECRET_KEY,
        auth_code: authCode
    }).then((response) => {
        if (response.s == 'ok') {
            const accessToken = response.access_token;
            fyers.setAccessToken(accessToken);
            res.json({ message: "Access Token generated", accessToken });
        } else {
            res.status(400).json({ message: "Error generating access token", error: response });
        }
    }).catch(err => {
        res.status(500).json({ message: "Internal Server Error", error: err });
    });
});

// Step 3: Get Account Profile Information
app.get('/profile', (req, res) => {
    fyers.get_profile().then((response) => {
        res.json(response);
    }).catch((err) => {
        res.status(500).json({ message: "Error fetching profile", error: err });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
