import React from 'react';

function Cancel() {
    return (
        <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'Arial' }}>
            <h1>❌ Payment Cancelled</h1>
            <p>Your payment was cancelled. You can try again anytime.</p>
            <a href="/">Return to Home</a>
        </div>
    );
}

export default Cancel;