import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ArrowLeft } from 'lucide-react';

const CoursesPage = () => {
  return (
    <div className="py-20 bg-grima-50 min-h-[70vh] flex flex-col justify-center">
        {/* Removed "Back to All Services" button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-auto">
        <BookOpen className="h-16 w-16 text-grima-primary mx-auto mb-6" strokeWidth={1.5}/>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Courses Coming Soon!</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          I'm currently developing in-depth financial courses to provide even more value. While they're in the works, consider a 1-1 coaching session to get personalized guidance today.
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

export default CoursesPage;