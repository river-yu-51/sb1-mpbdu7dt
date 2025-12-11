import React, { useState, useEffect, useRef } from 'react';

const Citation = ({ number, url, children }: { number: number, url: string, children: React.ReactNode }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // This hook handles clicking away from the tooltip to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  return (
    <div className="inline-block relative" ref={wrapperRef}>
      <sup
        className="font-semibold cursor-pointer ml-0.5 underline text-current"
        onClick={() => setShowTooltip(!showTooltip)}
      >
        {number}
      </sup>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-black text-white text-xs rounded-md shadow-lg z-10 text-left">
          <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {children}
          </a>
          {/* This creates the little arrow at the bottom of the tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-black"></div>
        </div>
      )}
    </div>
  );
};

export default Citation;