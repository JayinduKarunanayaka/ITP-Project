import React from 'react'
import { assets } from '../assets/assets'

const Features = () => {
  const features = [
    {
      title: "Medical & Support Info",
      desc: "Maintain doctor details, caretaker contacts, and clinic appointment history. Securely store medical scans and summaries in one place.",
      image: assets.Medication_info, 
      reverse: false,
      tags: ["Secure Storage", "Emergency Contacts"]
    },
    {
      title: "Smart Time Allocation",
      desc: "Set specific periods for medication intake. Once the time passes the allocated frame, the system sends an automated reminder to your device.",
      image: assets.Time_allocation, 
      reverse: true,
      tags: ["Automated Reminders", "Real-time Alerts"] 
    },
    {
      title: "Health Notes & Symptoms",
      desc: "Record daily symptoms with severity levels. View complete history and trends to share with your healthcare provider during visits.",
      image: assets.Helth_notes, 
      reverse: false,
      tags: ["Symptom Tracking", "Trend Analysis"]
    },
    {
      title: "Adherence Tracking",
      desc: "Monitor your health with clinically-backed reporting. Our system calculates your adherence rate using medical-standard equations, providing clear insights into taken versus missed doses to ensure treatment success.",
      image: assets.Adherence_tracking,
      reverse: true,
      tags: ["Clinical Measures", "Risk Alerts", "Progress Reports"]
    },
    {
      title: "Inventory Management",
      desc: "Automatic stock tracking that decreases quantity as you take doses. Receive smart alerts when it's time for a refill.",
      image: assets.Inventory, 
      reverse: false,
      tags: ["Low Stock Alerts", "Prescription Storage"]
    }
  ]

  return (
    <section id="features-section" className='py-24 bg-white'>
      <div className='max-w-7xl mx-auto px-6 md:px-24'>
        
        <h2 className='text-3xl md:text-5xl font-bold text-center text-gray-900 mb-20'>
          Advanced Tools for <span className='text-emerald-600'>Medication Adherence</span>
        </h2>

        <div className='flex flex-col gap-32'>
          {features.map((f, index) => (
            <div key={index} className={`flex flex-col ${f.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16`}>
              
              <div className='flex-1 w-full relative'>
                <div className='absolute inset-0 bg-emerald-50 rounded-3xl -rotate-2 scale-105 -z-10'></div>
                <img 
                    src={f.image} 
                    alt={f.title} 
                    className='w-full h-80 md:h-[450px] object-cover rounded-3xl shadow-xl border-4 border-white'
                />
              </div>

              <div className='flex-1 text-left'>
                <h3 className='text-2xl md:text-4xl font-bold text-gray-800 mb-6'>{f.title}</h3>
                <p className='text-gray-600 text-lg leading-relaxed mb-8'>{f.desc}</p>
                
                <ul className='space-y-4'>
                    {f.tags.map((tag, i) => (
                        <li key={i} className='flex items-center gap-3 text-emerald-700 font-semibold'>
                            <div className='w-2 h-2 bg-emerald-500 rounded-full'></div>
                            {tag}
                        </li>
                    ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features