import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Recommendations from './pages/Recommendations'
import Login from './pages/Login'
import Movies from './pages/Movies'
import SimilarMovies from './pages/SimilarMovies'
import Trending from './pages/Trending'
import ManageUsers from './pages/ManageUsers'
import ManageMovies from './pages/ManageMovies'
import UserRatings from './pages/UserRatings'

export default function App(){
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Login />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:movieId/similar" element={<SimilarMovies />} />
        <Route path="/trending" element={<Trending />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/movies" element={<ManageMovies />} />
        <Route path="/ratings/:userId" element={<UserRatings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
