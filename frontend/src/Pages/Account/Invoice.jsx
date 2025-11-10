import { useState, useEffect } from "react";
import "../../styles/Account/Invoice.css";
import { invoiceAPI, renterAPI } from "services/api";

function Invoice() {
  const renterId = localStorage.getItem("renterId");

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const isAuthenticated = () => {
    return !!localStorage.getItem("jwtToken");
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage] = useState(3);

  useEffect(() => {
    const controller = new AbortController();
    async function loadInvoices() {
      if (!renterId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await renterAPI.getInvoices(renterId);
        setInvoices(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") {
          setError(e.message || "Failed to load invoices");
        }
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
    return () => controller.abort();
  }, [renterId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      0: { text: 'Pending', class: 'pending' },
      1: { text: 'Paid', class: 'paid' },
      2: { text: 'Overdue', class: 'overdue' },
      3: { text: 'Cancelled', class: 'cancelled' }
    };
    const statusInfo = statusMap[status] || { text: 'Unknown', class: 'unknown' };
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  const handleViewDetails = async (invoiceId) => {
    setDetailLoading(true);
    setError("");
    try {
      const invoiceDetail = await invoiceAPI.getById(invoiceId);
      setSelectedInvoice(invoiceDetail);
      setShowDetailModal(true);
    } catch (e) {
      setError(e.message || "Failed to load invoice details");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedInvoice(null);
  };

  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = invoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(invoices.length / invoicesPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Go to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when invoices change
  useEffect(() => {
    setCurrentPage(1);
  }, [invoices]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading invoices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return (
      <div className="empty-state">
        <h3>Access Denied</h3>
        <p>Please log in to view your invoices.</p>
      </div>
    );
  }

  return (
    <div className="invoice-content">
      <div className="invoice-header">
        <h2>My Invoices</h2>
        <p>View and download your rental invoices</p>
      </div>

      {invoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🧾</div>
          <h3>No Invoices Yet</h3>
          <p>Your invoices will appear here once you complete rental contracts.</p>

        </div>
      ) : (
        <>
          <div className="invoices-list">
            {currentInvoices.map((invoice) => (
              <div key={invoice.invoiceId} className="invoice-card">
                <div className="invoice-header-card">
                  <h3>Invoice #{invoice.invoiceId}</h3>
                  {getStatusBadge(invoice.status)}
                </div>

                <div className="invoice-details">
                  <div className="detail-row">
                    <span className="label">Contract:</span>
                    <span className="value">#{invoice.contractId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Issue Date:</span>
                    <span className="value">{formatDate(invoice.issuedAt)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Due Date:</span>
                    <span className="value">{formatDate(invoice.paymentDeadline)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Amount Due:</span>
                    <span className="value">₫{invoice.amountDue?.toLocaleString() || '0'}</span>
                  </div>
                </div>

                <div className="invoice-actions">
                  <button
                    className="view-details-btn"
                    onClick={() => handleViewDetails(invoice.invoiceId)}
                    disabled={detailLoading}
                  >
                    {detailLoading ? 'Loading...' : 'View Details'}
                  </button>
                  {invoice.status === 0 && (
                    <button className="download-invoice-btn">
                      Download PDF
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {indexOfFirstInvoice + 1} to {Math.min(indexOfLastInvoice, invoices.length)} of {invoices.length} invoices
              </div>

              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                <div className="pagination-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                      onClick={() => paginate(number)}
                    >
                      {number}
                    </button>
                  ))}
                </div>

                <button
                  className="pagination-btn"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Invoice Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={closeDetailModal}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '30px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa',
              borderRadius: '30px 30px 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h3 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>Invoice Details #{selectedInvoice.invoiceId}</h3>
                {getStatusBadge(selectedInvoice.status)}
              </div>
              <button
                onClick={closeDetailModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '5px',
                  borderRadius: '50%'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '25px' }}>
              <div>
                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>Invoice Information</h4>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Contract ID:</strong> {selectedInvoice.contractId}</p>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Issue Date:</strong> {formatDate(selectedInvoice.issuedAt)}</p>
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>Payment Information</h4>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Payment Deadline:</strong> {formatDate(selectedInvoice.paymentDeadline)}</p>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Paid At:</strong> {selectedInvoice.paidAt ? formatDate(selectedInvoice.paidAt) : 'Not paid'}</p>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Is Expired:</strong> {selectedInvoice.isExpired ? 'Yes' : 'No'}</p>
                </div>

                <div>
                  <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>Amount Details</h4>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Amount Due:</strong> ₫{selectedInvoice.amountDue?.toLocaleString() || '0'}</p>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Amount Paid:</strong> ₫{selectedInvoice.amountPaid?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </div>

            <div style={{
              padding: '25px',
              borderTop: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: '0 0 30px 30px'
            }}>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 'bold',
                color: '#28a745'
              }}>
                Amount Due: ₫{selectedInvoice.amountDue?.toLocaleString() || '0'} 🤑
              </div>
              <button
                onClick={closeDetailModal}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoice;
