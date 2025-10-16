import React from 'react';

function Cancel() {
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
                <h1 style={{ marginBottom: '20px' }}>❌ Payment Cancelled</h1>
                <p style={{ marginBottom: '15px' }}>
                    Your payment was cancelled. You can try again anytime.
                </p>
                <a href="/" style={{ marginBottom: '15px', display: 'inline-block' }}>
                    Return to Home
                </a>
            </div>
        </div>
    );
}

export default Cancel;
