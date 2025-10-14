import React from 'react';
import { useSearchParams } from 'react-router-dom';

function Success() {
    const [searchParams] = useSearchParams();
    const orderCode = searchParams.get('orderCode');

    return (
        <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'Arial' }}>
            <h1>✅ Payment Successful!</h1>
            <p>Thank you for your payment. Your rental has been confirmed.</p>
            {orderCode && <p>Order Code: {orderCode}</p>}
            <a href="/">Return to Home</a>
        </div>
    );
}

export default Success;