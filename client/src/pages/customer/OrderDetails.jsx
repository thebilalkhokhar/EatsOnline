  {/* Review Section */}
  {order.status === "Delivered" && !hasReview && (
    <div className="review-section">
      {!showReviewForm ? (
        <button 
          className="write-review-btn" 
          onClick={() => setShowReviewForm(true)}
        >
          Write a Review
        </button>
      ) : (
        <div className="review-form-container">
          <h3>Write Your Review</h3>
          <ReviewForm
            orderId={order._id}
            restaurantId={order.restaurantId._id}
            onSuccess={handleReviewSuccess}
          />
          <button 
            className="cancel-review-btn"
            onClick={() => setShowReviewForm(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )} 