import React from 'react'
import Navbar from '../components/navbar'
import Header from '../components/header'
import Features from '../components/features'
import Contact from '../components/contact'

const home = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      <Navbar/>
      <main className='pt-20'>
        <Header/>
        <Features/>
        <Contact/>
      </main>
    </div>
  )
}

export default home
