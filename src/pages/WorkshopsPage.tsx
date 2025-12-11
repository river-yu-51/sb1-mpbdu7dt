import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Box } from 'lucide-react'; // Using Box icon for workshops

const WorkshopsPage = () => {
  return (
    <div className="py-20 bg-grima-50 min-h-[70vh] flex flex-col justify-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-auto">
        <Box className="h-16 w-16 text-grima-primary mx-auto mb-6" strokeWidth={1.5}/>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Workshops Coming Soon!</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Interactive workshops covering practical financial skills are currently in development. These will offer hands-on learning experiences for groups. In the meantime, you can explore personalized guidance with a 1-1 coaching session.
        </p>
        <Link
          to="/booking"
          className="bg-grima-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-grima-dark transition-colors duration-200 inline-flex items-center"
        >
          Book a 1-1 Session
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
    </div>
  );
};

export default WorkshopsPage;