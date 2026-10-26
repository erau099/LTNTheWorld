import { useEffect, useState } from 'react'

function Review() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/reviews/my-reviews', {
      headers: {
        credentials: "include",
      },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => setReviews(data))
      .catch(err => {
        console.error('Failed to load reviews:', err)
        setError('Could not load your reviews.')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1>My Reviews</h1>

      {loading && <p>Loading reviews...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && reviews.length === 0 && (
        <p>You haven't submitted any reviews yet.</p>
      )}

      {reviews.map(review => (
        <div
          key={review.id}
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
          }}
        >
          <h3>{review.food?.foodItem ?? 'Food review'}</h3>

          <p>
            <strong>Rating:</strong> {review.rating}/5
          </p>

          <p>{review.comment || 'No comment provided.'}</p>

          <small>
            {review.createdAt
              ? new Date(review.createdAt).toLocaleDateString()
              : ''}
          </small>
        </div>
      ))}
    </div>
  )
}

export default Review