export const processCoinbasePayment = async (amount, currency) => {
    try {
        const response = await fetch('https://api.commerce.coinbase.com/charges', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CC-Api-Key': process.env.NEXT_PUBLIC_COINBASE_API_KEY, // Use Environment Variable
                'X-CC-Version': '2018-03-22'
            },
            body: JSON.stringify({
                name: "Course Purchase",
                description: "Access to Premium Content",
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
