import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { invoiceAPI } from '../../services/api';

function Cancel() {
    const [searchParams] = useSearchParams();
    
    useEffect(() => {
        const orderCode = searchParams.get('orderCode');
        if (orderCode) {
            invoiceAPI.deleteByOrderCode(orderCode)
                .then(() => console.log('Invoice deleted'))
                .catch(err => console.error('Failed to delete invoice:', err));
        }
    }, [searchParams]);

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

export default Cancel;