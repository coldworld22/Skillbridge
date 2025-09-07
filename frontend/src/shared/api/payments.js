import { fetchCoinbaseApiKey } from '@/services/paymentMethodService';

export const processCoinbasePayment = async (amount, currency) => {
    try {
        let apiKey = null;
        try {
            apiKey = await fetchCoinbaseApiKey();
        } catch (_err) {
            // ignore
        }
        if (!apiKey && process.env.NEXT_PUBLIC_COINBASE_API_KEY) {
            apiKey = process.env.NEXT_PUBLIC_COINBASE_API_KEY;
        }

        const response = await fetch('https://api.commerce.coinbase.com/charges', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CC-Api-Key': apiKey || '',
                'X-CC-Version': '2018-03-22'
            },
            body: JSON.stringify({
                name: "Course Purchase",
                description: "Access to Prime Content",
                pricing_type: "fixed_price",
                local_price: { amount: amount, currency: currency }
            })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Coinbase Payment Error:", error);
        return null;
    }
};
