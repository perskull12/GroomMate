const axios = require('axios');

const mpesaConfig = {
    consumerKey: 'scmcUhdChdu6CQ8rX97wFVOUTgE7GpuMD43aTGcg65NspXfP',
    consumerSecret: 'yLrxEUFMjNSVuERcXpfItAXeV9unsOKnLmwniBIxvanbdxWGeP6QfIOe9eTnYuSX',
    passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    shortcode: '174379',
    callbackUrl:'https://3af1de8e1d80.ngrok-free.app/api/booking/callback'
};

const getOAuthToken = async () => {
    try {
        const auth = Buffer.from(`${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`).toString('base64');
        
        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                headers: {
                    Authorization: `Basic ${auth}`
                }
            }
        );
        
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting OAuth token:', error);
        throw error;
    }
};

const initiateSTKPush = async (phoneNumber, amount) => {
    try {
        const sanitizedAmount = parseInt(amount);
        if (isNaN(sanitizedAmount) || sanitizedAmount <= 0) {
            throw new Error("Invalid amount: must be a positive number");
        }

        const token = await getOAuthToken();
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
        const password = Buffer.from(
            `${mpesaConfig.shortcode}${mpesaConfig.passkey}${timestamp}`
        ).toString('base64');

        console.log("STK Payload Preview:", {
            phoneNumber,
            sanitizedAmount,
            timestamp,
            password
        });

        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            {
                BusinessShortCode: mpesaConfig.shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: sanitizedAmount,
                PartyA: phoneNumber,
                PartyB: mpesaConfig.shortcode,
                PhoneNumber: phoneNumber,
                CallBackURL: mpesaConfig.callbackUrl,
                AccountReference: 'GroomMate Booking',
                TransactionDesc: 'Booking Payment'
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error initiating STK push:', error.response?.data || error.message);
        throw error;
    }
};


module.exports = { mpesaConfig, getOAuthToken, initiateSTKPush };