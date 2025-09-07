export const processCoinbasePayment = async (payload) => {
    try {
        const response = await fetch('/api/payments/coinbase/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Coinbase Payment Error:", error);
        return null;
    }
};
