'use client'
import React, { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ConnectWalletButton from './ConnectWalletButton'
import { MavenPro } from '../page'


const LandingPage = () => {
  const [input, setInput] = useState('')
  const router = useRouter()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    router.push(`/Chat?message=${encodeURIComponent(input.trim())}`)
  }

  return (
    <div className={MavenPro.className}>
      <div className="h-screen w-full flex justify-center items-center bg-zinc-950 relative">
        {/* Grainy Texture */}
        <div className="absolute inset-0 opacity-50 z-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          filter: 'contrast(100%) brightness(20%)'
        }} />
        
        {/* Connect Wallet Button */}
        <div className='absolute top-10 right-10 z-10'>
          <ConnectWalletButton/>
        </div>

        <div className='w-full h-full flex flex-col justify-center items-center px-4 relative z-10'>
          {/*Loading Icon */}
          <div className='star-parent relative w-[300px] h-[160px] rounded-tr-full rounded-tl-full rounded-bl-full bg-gradient-to-br from-indigo-600 via-pink-300 to-indigo-600 flex justify-center items-center'>
            <div className='star absolute w-60 h-28 bg-zinc-950 rounded-full flex justify-center items-center gap-4'>
              <div className='w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-pink-300 from-[0%] to-[100%] animate-bounce [animation-delay:-0.3s]'></div>
              <div className='w-6 h-6 rounded-full bg-pink-300 animate-bounce [animation-delay:-0.15s]'></div>
              <div className='w-6 h-6 rounded-full bg-gradient-to-tl from-indigo-600 to-pink-300 from-[0%] to-[100%] animate-bounce'></div>
            </div>
          </div>

          {/* Heading */}
          <div className='text-center my-20 relative'>
            <h1 className='text-5xl text-white mb-2 tracking-tight'>
              Artifex AI
            </h1>
            <p className='text-xl text-gray-400'>Your Smart Contract Companion</p>
          </div>
          
          <form onSubmit={handleSubmit} className="relative w-full max-w-[400px]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="w-full px-4 py-3 rounded-full bg-zinc-800/50 text-white border border-zinc-700 focus:outline-none focus:border-indigo-600 pr-12"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-br from-indigo-600 to-pink-300 from-[0%] to-[100%] rounded-full hover:scale-105 transition-all duration-400 ease-in-out"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LandingPage