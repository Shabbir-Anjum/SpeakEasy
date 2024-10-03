'use client'
import React from 'react';
import { motion } from 'framer-motion';
import { Plus, List, Brain, Settings, User } from 'lucide-react';
import Link from 'next/link';

const Logo = () => (
  <div className="flex items-center">
    <Brain className="text-blue-500 mr-2" size={32} />
    <span className="text-xl font-bold">Intervuo</span>
  </div>
);

const Header = () => (
  <header className="absolute top-0 left-0 right-0 z-20 bg-black bg-opacity-20">
    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
      <Link href="/">
        <Logo />
      </Link>
      <nav>
        <ul className="flex space-x-6">
          <li><Link href="/" className="hover:text-blue-400 transition-colors">Home</Link></li>
          <li><Link href="/features" className="hover:text-blue-400 transition-colors">Features</Link></li>
          <li><Link href="/pricing" className="hover:text-blue-400 transition-colors">Pricing</Link></li>
          <li><Link href="/contact" className="hover:text-blue-400 transition-colors">Contact</Link></li>
        </ul>
      </nav>
    </div>
  </header>
);

const Footer = () => (
  <footer className="absolute bottom-0 left-0 right-0 z-20 bg-black bg-opacity-20">
    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
      <div className="text-sm">© 2024 Intervuo. All rights reserved.</div>
      <div className="flex space-x-4">
        <Link href="/settings" className="hover:text-blue-400 transition-colors">
          <Settings size={20} />
        </Link>
        <Link href="/profile" className="hover:text-blue-400 transition-colors">
          <User size={20} />
        </Link>
      </div>
    </div>
  </footer>
);

const SimplifiedAIAssistantPage = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed relative text-white flex items-center"
         style={{ backgroundImage: 'url("/1.jpg")' }}>
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      <Header />
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-2xl">
          <motion.h1
            className="text-5xl md:text-6xl font-bold mb-6"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            Your AI Assistant Awaits
          </motion.h1>
          
          <motion.p
            className="text-xl mb-8"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            Create your personalized AI companion with advanced voice recognition and intelligent learning capabilities. Provide knowledge data to craft custom agents tailored to your needs. Experience the future of digital assistance today.
          </motion.p>
          
          <motion.div
            className="flex space-x-4"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <Link href="/create-agent">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full flex items-center shadow-lg transition-colors"
              >
                <Plus className="mr-2" size={20} />
                Create Assistant
              </motion.button>
            </Link>
            <Link href="/my-agents">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full flex items-center shadow-lg transition-colors"
              >
                <List className="mr-2" size={20} />
                My Assistants
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SimplifiedAIAssistantPage;