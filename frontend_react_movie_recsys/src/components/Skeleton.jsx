import React from 'react'

export function MovieCardSkeleton(){
  return (
    <div className="movie-card">
      <div className="skeleton" style={{ width: 84, height: 126, borderRadius: 8, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 18, width: '60%' }} />
        <div className="skeleton" style={{ height: 12, width: '40%' }} />
        <div className="skeleton" style={{ height: 12, width: '90%' }} />
        <div className="skeleton" style={{ height: 12, width: '75%' }} />
      </div>
    </div>
  )
}

export function CardGridSkeleton({ count = 4 }){
  return (
    <div className="card-grid">
      {Array.from({ length: count }).map((_, i) => <MovieCardSkeleton key={i} />)}
    </div>
  )
}

export function ListSkeleton({ count = 3 }){
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => <MovieCardSkeleton key={i} />)}
    </div>
  )
}
