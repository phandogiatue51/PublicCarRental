import { useState, useCallback } from 'react';
import { refundAPI } from '../services/api';

export const useRefund = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestRefund = useCallback(async (requestData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await refundAPI.requestRefund(requestData);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const processRefund = useCallback(async (refundId, bankInfo, fullRefund = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await refundAPI.processRefund(refundId, bankInfo, fullRefund);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const staffRefund = useCallback(async (contractId, amount, reason, staffId, note, bankInfo, fullRefund) => {
    setLoading(true);
    setError(null);
    try {
      const response = await refundAPI.staffRefund({
        contractId,
        amount,
        reason,
        staffId,
        note,
        bankInfo,
        fullRefund
      });
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Refund failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getRefundPreview = useCallback(async (contractId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await refundAPI.getRefundPreview(contractId);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    requestRefund,
    processRefund,
    staffRefund,
    getRefundPreview,
    clearError: () => setError(null)
  };
};