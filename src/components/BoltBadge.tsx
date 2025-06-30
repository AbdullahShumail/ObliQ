import React from 'react';
import { motion } from 'framer-motion';

interface BoltBadgeProps {
  isDark: boolean;
}

export const BoltBadge: React.FC<BoltBadgeProps> = ({ isDark }) => {
  return (
    <motion.a
      href="https://bolt.new/"
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-tertiary group"
      title="Built with Bolt.new"
    >
      <div className="relative">
        <img
          src="/white_circle_360x360.svg"
          alt="Bolt.new"
          className={`h-8 w-8 transition-all duration-300 ${
            isDark 
              ? 'opacity-100' 
              : 'opacity-0'
          }`}
        />
        {/* Black circle for light mode - we'll create this inline since we only have white */}
        <div className={`absolute inset-0 h-8 w-8 rounded-full bg-black flex items-center justify-center transition-all duration-300 ${
          isDark 
            ? 'opacity-0' 
            : 'opacity-100'
        }`}>
          <svg 
            viewBox="0 0 360 360" 
            className="h-6 w-6 fill-white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M 202.25 31.08 A 0.32 0.32 0.0 0 0 202.19 31.67 C 210.30 35.46 206.73 46.46 198.47 46.05 Q 193.62 45.81 184.79 44.60 A 0.37 0.37 0.0 0 1 184.47 44.19 L 187.69 16.40 A 0.40 0.40 0.0 0 1 188.14 16.04 Q 197.39 17.06 199.96 17.46 C 203.76 18.04 207.08 20.58 207.15 24.69 Q 207.24 29.82 202.25 31.08 Z"/>
            <path d="M 159.54 46.55 Q 157.97 46.78 157.62 46.83 A 0.67 0.67 0.0 0 1 156.87 46.27 L 155.46 36.80 A 2.17 2.14 -69.3 0 0 155.02 35.80 L 142.52 20.13 A 0.13 0.13 0.0 0 1 142.60 19.92 L 148.00 19.12 A 0.41 0.40 66.4 0 1 148.39 19.28 Q 151.75 23.72 156.85 30.38 Q 157.05 30.64 157.19 30.62 Q 157.34 30.60 157.45 30.29 Q 160.41 22.44 162.35 17.22 A 0.41 0.40 -83.2 0 1 162.67 16.96 L 168.07 16.16 A 0.13 0.13 0.0 0 1 168.21 16.34 L 160.77 34.95 A 2.17 2.14 52.5 0 0 160.63 36.04 L 162.02 45.51 A 0.67 0.67 0.0 0 1 161.46 46.26 Q 161.11 46.32 159.54 46.55 Z"/>
            <path d="M 178.83 145.19 A 0.28 0.28 0.0 0 0 179.31 145.44 C 186.85 137.21 195.69 132.47 206.95 132.38 C 230.15 132.19 244.93 147.17 246.88 169.79 C 250.12 207.23 225.72 251.26 181.74 243.74 Q 168.96 241.55 160.32 231.52 A 0.34 0.34 0.0 0 0 159.73 231.67 L 157.66 241.10 A 1.77 1.76 -7.6 0 1 156.76 242.27 L 112.83 265.59 A 0.25 0.25 0.0 0 1 112.47 265.32 L 149.95 94.73 A 0.46 0.45 -83.6 0 1 150.39 94.37 L 189.39 94.37 A 0.50 0.49 -83.8 0 1 189.87 94.97 L 178.83 145.19 Z"/>
          </svg>
        </div>
      </div>
      <span className="text-xs font-medium text-muted group-hover:text-primary transition-colors hidden sm:inline">
        Built with Bolt
      </span>
    </motion.a>
  );
};