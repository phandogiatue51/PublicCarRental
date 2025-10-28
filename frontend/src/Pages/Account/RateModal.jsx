import { useState } from "react";
import { ratingsAPI } from "../../services/api"; 

function RateModal({ contract, isOpen, onClose, onRatingSubmitted }) {
  
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleStarClick = (starCount) => {
    setStars(starCount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (stars === 0) {
      setError("Please select a star rating");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const ratingData = {
        contractId: contract.contractId,
        renterId: parseInt(localStorage.getItem("renterId")),
        stars: stars,
        comment: comment.trim() || null
      };

      await ratingsAPI.create(ratingData);
      
      // Callback to refresh contracts list
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
      
      // Close modal
      onClose();
      
      // Reset form
      setStars(0);
      setComment("");
      
    } catch (err) {
      setError(err.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStars(0);
    setComment("");
    setError("");
    onClose();
  };

    return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000,
      fontSize: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '15px',
        padding: '20px',
        maxWidth: '700px',
        width: '90%',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }} onClick={(e) => e.stopPropagation()}>
        <h2>Rate Your Experience</h2>
        <p>Contract #{contract.contractId}</p>
        
        <div style={{ display: 'flex', gap: '10px', margin: '15px 0' }}>
          {[1,2,3,4,5].map(star => (
            <button key={star} onClick={() => handleStarClick(star)}>
              {star <= stars ? '⭐' : '☆'}
            </button>
          ))}
        </div>
        
        <textarea 
          placeholder="Your comments..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{ width: '100%', height: '100px', margin: '10px 0' }}
        />
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}


export default RateModal;