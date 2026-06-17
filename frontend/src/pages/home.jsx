import React, { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/navbar'
import Header from '../components/header'
import Features from '../components/features'
import Contact from '../components/contact'
import { feedbackAPI } from '../services/api'

const home = () => {
  const [testimonials, setTestimonials] = useState([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data } = await feedbackAPI.getPublic()
        setTestimonials(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error loading public testimonials:', error)
        setTestimonials([])
      } finally {
        setLoadingTestimonials(false)
      }
    }

    fetchTestimonials()
  }, [])

  useEffect(() => {
    if (testimonials.length <= 1) return undefined

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % testimonials.length)
    }, 5500)

    return () => window.clearInterval(timer)
  }, [testimonials.length])

  useEffect(() => {
    if (activeSlide >= testimonials.length) {
      setActiveSlide(0)
    }
  }, [activeSlide, testimonials.length])

  const visibleTestimonial = useMemo(() => {
    if (!testimonials.length) return null
    return testimonials[activeSlide % testimonials.length]
  }, [testimonials, activeSlide])

  const ratingLabel = (rating) => {
    if (rating >= 5) return 'Outstanding'
    if (rating >= 4) return 'Strong'
    if (rating >= 3) return 'Helpful'
    return 'Average'
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      <Navbar/>
      <main className='pt-20'>
        <Header/>
        <Features/>
        <section className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20'>
          <div className='grid gap-6 lg:grid-cols-[0.9fr_1.1fr] items-start'>
            <div className='space-y-4'>
              <p className='text-sm font-bold uppercase tracking-[0.35em] text-emerald-600'>Community Voice</p>
              <h2 className='text-3xl sm:text-4xl font-black text-slate-900 leading-tight'>What users say about the platform</h2>
              <p className='text-slate-600 text-base sm:text-lg max-w-xl'>
                Public visitors can browse all feedback in a clean slideshow so they can quickly understand the experience shared by real users.
              </p>
              <div className='inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700'>
                <span className='h-2.5 w-2.5 rounded-full bg-emerald-500'></span>
                All feedback entries
              </div>
            </div>

            <div className='rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 shadow-[0_20px_60px_rgba(16,185,129,0.10)] p-5 sm:p-6'>
              {loadingTestimonials ? (
                <div className='py-12 text-center text-slate-400 font-medium'>Loading testimonials...</div>
              ) : testimonials.length > 0 ? (
                <div className='relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 p-4 sm:p-6 min-h-[22rem]'>
                  <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_26%)] pointer-events-none'></div>

                  <div className='relative flex items-center justify-between gap-4 mb-5'>
                    <div>
                      <p className='text-[10px] uppercase tracking-[0.35em] text-slate-400 font-bold'>Feedback Slideshow</p>
                      <h3 className='mt-2 text-2xl font-black text-slate-900'>{visibleTestimonial?.userName || 'Anonymous'}</h3>
                    </div>
                    <div className='flex items-center gap-2'>
                      <button
                        type='button'
                        onClick={() => setActiveSlide((current) => (current - 1 + testimonials.length) % testimonials.length)}
                        className='h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center'
                        aria-label='Previous feedback'
                      >
                        <i className='fa-solid fa-chevron-left'></i>
                      </button>
                      <button
                        type='button'
                        onClick={() => setActiveSlide((current) => (current + 1) % testimonials.length)}
                        className='h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center'
                        aria-label='Next feedback'
                      >
                        <i className='fa-solid fa-chevron-right'></i>
                      </button>
                    </div>
                  </div>

                  <div className='relative grid gap-5'>
                    <div className='flex items-center justify-between flex-wrap gap-3'>
                      <div className='flex items-center gap-2'>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <i
                            key={index}
                            className={`fa-solid fa-star text-sm ${index < Number(visibleTestimonial?.rating || 0) ? 'text-amber-400' : 'text-slate-200'}`}
                          ></i>
                        ))}
                      </div>
                      <div className='inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700'>
                        {visibleTestimonial?.rating || 0}/5 • {ratingLabel(Number(visibleTestimonial?.rating || 0))}
                      </div>
                    </div>

                    <blockquote className='relative rounded-[1.5rem] border border-slate-100 bg-slate-50/90 p-6 sm:p-8 text-slate-700 text-lg sm:text-xl leading-9 shadow-sm'>
                      <span className='absolute -left-2 -top-6 text-6xl text-emerald-200 font-black select-none'>“</span>
                      <p className='relative z-10'>{visibleTestimonial?.description || 'No feedback available.'}</p>
                    </blockquote>

                    <div className='flex items-center justify-between gap-3 flex-wrap'>
                      <div className='space-y-1'>
                        <p className='text-xs uppercase tracking-wider text-emerald-600 font-bold'>{visibleTestimonial?.type || 'Feedback'}</p>
                        <p className='text-sm text-slate-500'>
                          {visibleTestimonial?.status ? `Status: ${visibleTestimonial.status}` : 'Public submission'}
                        </p>
                      </div>
                      <div className='flex gap-2'>
                        {testimonials.map((item, index) => (
                          <button
                            key={item._id}
                            type='button'
                            onClick={() => setActiveSlide(index)}
                            className={`h-2.5 rounded-full transition-all ${index === activeSlide ? 'w-8 bg-emerald-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`}
                            aria-label={`Show feedback ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='py-12 text-center text-slate-400 font-medium'>No feedback available yet.</div>
              )}
            </div>
          </div>
        </section>
        <Contact/>
      </main>
    </div>
  )
}

export default home
