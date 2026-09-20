import React from 'react'

export default function EmptyState({ title, description }){
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {description && <p style={{ marginTop: 6 }}>{description}</p>}
    </div>
  )
}
