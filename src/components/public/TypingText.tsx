"use client"
import React, { useState, useEffect } from 'react';

interface Props {
  text: string;
  className?: string;
  speed?: number;
}

export const TypingText = ({ text, className = "", speed = 100 }: Props) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let index = 0;
    setDisplayedText(''); // Reset when text changes (e.g. locale change)
    
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, index));
      index++;
      if (index > text.length) clearInterval(timer);
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <div className={`inline-flex items-center ${className}`}>
      <span>{displayedText}</span>
      <span className="ml-1 w-0.5 h-[1.2em] bg-primary/40 animate-pulse" />
    </div>
  );
};
