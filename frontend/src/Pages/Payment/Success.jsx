import React from 'react';
import { useSearchParams } from 'react-router-dom';

function Success() {
    const [searchParams] = useSearchParams();
    const orderCode = searchParams.get('orderCode');

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '18px',
            fontFamily: 'Arial'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ marginBottom: '20px' }}>✅ Payment Successful!</h1>
                <p style={{ marginBottom: '15px' }}>
                    Thank you for your payment. Your rental has been confirmed.
                </p>
                {orderCode && (
                    <p style={{ marginBottom: '15px' }}>
                        Order Code: {orderCode}
                    </p>
                )}
                <a href="/" style={{ marginBottom: '15px', display: 'inline-block' }}>
                    Return to Home
                </a>
            </div>
        </div>
    );
}

export default Success;
