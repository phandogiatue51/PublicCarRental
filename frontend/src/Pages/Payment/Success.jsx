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
                    Thank you for your payment. Your booking request has been confirmed.
                </p>
                <p style={{ marginBottom: '15px' }}>
                    A receipt has been sent to your email address (even in Spam).
                </p>

                {orderCode && (
                    <p style={{ marginBottom: '15px' }}>
                        Order Code: {orderCode}
                    </p>
                )}
                <a
                    href="/"
                    style={{
                        marginBottom: '15px',
                        display: 'inline-block',
                        backgroundColor: '#ff3c00ff', 
                        color: '#fff',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        textDecoration: 'none'
                    }}
                >
                    Return to Home
                </a>

            </div>
        </div>
    );
}

export default Success;
