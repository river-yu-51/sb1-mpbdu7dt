import React, { useState, useRef } from 'react';
import { Info } from 'lucide-react';

const Tooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="inline-block relative ml-1">
      <Info
        size={14}
        className="text-gray-400 cursor-pointer"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <div
          ref={ref}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-md shadow-lg z-20"
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;