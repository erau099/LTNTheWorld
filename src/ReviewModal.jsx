import { useState } from 'react'

function ReviewModal({ foodId, onClose, onSubmit }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (rating === 0) return
    onSubmit({ foodId, rating, comment })
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          background: 'white', padding: '24px', borderRadius: '8px',
          width: '360px', display: 'flex', flexDirection: 'column', gap: '12px',
        }}
      >
        <h2>Leave a Review</h2>

        <div>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {n <= rating ? '★' : '☆'}
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          placeholder="How was your pickup?"
          rows={4}
        />

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={rating === 0}>Submit</button>
        </div>
      </form>
    </div>
  )
}

export default ReviewModal