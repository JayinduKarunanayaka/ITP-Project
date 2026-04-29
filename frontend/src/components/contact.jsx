import React from 'react'
import { assets } from '../assets/assets'

const Contact = () => {
  return (
    <section id="contact-section" className='py-20 bg-emerald-50'>
      <div className='max-w-7xl mx-auto px-6 md:px-24 text-center'>
        
        <div className='mb-16'>
          <h2 className='text-3xl md:text-5xl font-bold text-gray-900 mb-4'>
            Get In <span className='text-emerald-600'>Touch</span>
          </h2>
          <p className='text-gray-600 text-lg max-w-2xl mx-auto'>
            Have questions about MedSync? Reach out to us through any of these platforms. 
            Our support team is available 24/7 to assist you.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          
          <div className='bg-white p-10 rounded-3xl shadow-sm border border-emerald-100 hover:shadow-md transition-all'>
            <div className='w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl'>
                <img src={assets.Mail_img} alt="Mail" />
            </div>
            <h3 className='text-xl font-bold text-gray-800 mb-2'>Email Us</h3>
            <p className='text-gray-500 mb-4'>For general inquiries</p>
            <a href="mailto:support@medsync.com" className='text-emerald-600 font-semibold hover:underline'>
                support@medsync.com
            </a>
          </div>

          <div className='bg-white p-10 rounded-3xl shadow-sm border border-emerald-100 hover:shadow-md transition-all'>
            <div className='w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl'>
                <img src={assets.Phone_img} alt="Mail" />
            </div>
            <h3 className='text-xl font-bold text-gray-800 mb-2'>Call Us</h3>
            <p className='text-gray-500 mb-4'>Mon-Fri from 8am to 5pm</p>
            <a href="tel:+94112345678" className='text-emerald-600 font-semibold hover:underline'>
                +94 11 224 5677
            </a>
          </div>

          <div className='bg-white p-10 rounded-3xl shadow-sm border border-emerald-100 hover:shadow-md transition-all'>
            <div className='w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl'>
                <img src={assets.Globe_img} alt="Mail" />
            </div>
            <h3 className='text-xl font-bold text-gray-800 mb-2'>Follow Us</h3>
            <p className='text-gray-500 mb-4'>Stay updated on social media</p>
            <div className='flex justify-center gap-4 mt-2'>
              
              <a href="https://facebook.com" target='_blank'>
                <button className='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-300 hover:text-white transition-all'>
                  <img src={assets.Fb_img} alt="F" />
                </button>
              </a>

              <button className='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-300 hover:text-white transition-all'>
                <img src={assets.Insta_img} alt="Intergram" />
              </button>

              <button className='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-300 hover:text-white transition-all'>
                <img src={assets.X_img} alt="X" />
              </button>
            </div>
          </div>

        </div>

        <div className='mt-16 p-6 bg-white/50 rounded-2xl inline-block border border-dashed border-emerald-200'>
            <p className='text-emerald-800 font-medium flex justify-center'>
                <span><img src={assets.Location_img} alt="Location:" /></span> Head Office: SLIIT Malabe Campus, New Kandy Rd, Malabe
            </p>
        </div>

      </div>
    </section>
  )
}

export default Contact