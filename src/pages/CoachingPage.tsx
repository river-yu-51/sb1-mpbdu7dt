import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Gift, User, ArrowLeft } from 'lucide-react';

const services = [
  {
    category: "Informational Sessions",
    description: "1-1 coaching designed to build your knowledge and confidence on core financial topics.",
    price: "$30",
    duration: "30-60 min",
    items: [
      { 
        title: "Spending Habits", 
        features: ["Reasons to Track Spending", "Types of Spending", "Tracking Techniques", "Psychological Supports"] 
      },
      { 
        title: "Budgeting", 
        features: ["Reasons to Budget", "Budgeting Categories", "Budgeting Methods", "Budgeting Tools"] 
      },
      { 
        title: "Credit Cards", 
        features: ["Understanding Credit Cards", "Preventing Debt", "Credit Card Benefits"] 
      },
      { 
        title: "Interest, Savings, & Loans", 
        features: ["Interest Rates", "Saving Habits", "Long-Term Saving", "Loans"] 
      },
      { 
        title: "Investing", 
        features: ["Investing Habits", "Investments", "Long-Term Investing", "Investment Risk"] 
      },
      { 
        title: "Taxes & Accounts", 
        features: ["Filing Taxes", "Account Types", "Tax Forms", "Tax Benefits & Credits"] 
      }
    ]
  },
  {
    category: "“Doing-Something” Sessions",
    description: "Guided, hands-on sessions where we work together to set up or review your financial tools.",
    price: "$30",
    duration: "30-60 min",
     items: [
      { title: '"The Spreadsheet"', features: ["Session details in the works...", "Stay tuned for updates!"] },
      { title: "Investing Setup/Review", features: ["Session details in the works...", "Stay tuned for updates!"] },
      { title: "Credit Card Setup/Review", features: ["Session details in the works...", "Stay tuned for updates!"] },
      { title: "Filing Your Taxes", features: ["Session details in the works...", "Stay tuned for updates!"] }
    ]
  },
   {
    category: "Maintenance Sessions",
    description: "Follow-up Q&A sessions to provide ongoing support and fine-tune your financial strategies.",
     items: [
      { title: "Half-Length", price: "$20", duration: "15 min", features: ["Quick progress review", "Targeted problem-solving", "Perfect for minor adjustments"] },
      { title: "Full-Length", price: "$30", duration: "30 min", features: ["In-depth progress review", "Strategy refinement & updates", "Ideal for standard check-ins"] },
      { title: "Double-Length", price: "$40", duration: "60 min", features: ["Comprehensive strategy overhaul", "Tackling multiple complex topics", "For in-depth guidance & support"] },
    ]
  }
];

const ServiceCard = ({ item, categoryPrice, categoryDuration }: any) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border">
    <div className="p-6 flex flex-col flex-grow">
      <div className="flex justify-between items-baseline mb-3">
        <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
        <p className="font-semibold text-grima-primary bg-grima-50 px-3 py-1 rounded-full text-sm">
            {item.price || categoryPrice}
        </p>
      </div>
      <p className="text-sm text-gray-500 mb-4">{item.duration || categoryDuration}</p>
      
      {item.features &&
        <div className="space-y-2 mb-6 flex-grow">
            {item.features.map((feature: string) => (
                <div key={feature} className="flex items-start text-sm">
                    <CheckCircle className="h-4 w-4 text-grima-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                </div>
            ))}
        </div>
      }
      {!item.features && <div className="flex-grow"></div>}

      <Link
        to="/booking"
        className="w-full mt-auto bg-grima-dark text-white py-3 px-4 rounded-lg font-semibold hover:bg-black transition-colors duration-200 flex items-center justify-center"
      >
        Book Session
        <ArrowRight className="ml-2 h-5 w-5" />
      </Link>
    </div>
  </div>
);


const CoachingPage = () => {
  return (
    <div className="py-20 bg-grima-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto mb-12">
            {/* Removed "Back to All Services" button */}
        </div>
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">1-1 Financial Coaching</h1>
        </div>
        
        <div className="space-y-20">
          {services.map(group => (
            <div key={group.category}>
              <div className="text-center mb-10">
                 <h2 className="text-3xl font-bold text-gray-800">{group.category}</h2>
                 <p className="text-md text-gray-500 max-w-2xl mx-auto mt-2">{group.description}</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {group.items.map((item, index) => <ServiceCard key={index} item={item} categoryPrice={group.price} categoryDuration={group.duration} />)}
              </div>
            </div>
          ))}
        </div>
        
        {/* Refer a Friend Section */}
        <div className="mt-24 bg-white rounded-2xl shadow-xl p-8 lg:p-12 border max-w-5xl mx-auto">
            <div className="text-center">
              <Gift className="h-12 w-12 text-grima-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Refer a Friend, You Both Save!</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Help a friend build their financial confidence and you'll both be rewarded.
              </p>
              <div className="bg-grima-50 border border-grima-100 p-6 rounded-lg max-w-2xl mx-auto mb-8 text-left">
                <h3 className="font-semibold text-gray-900 mb-4">How It Works</h3>
                <ol className="list-decimal list-inside space-y-3 text-gray-700">
                    <li>Tell your friend to mention your name during their Initial Consultation.</li>
                    <li>They will get <strong>50% off</strong> their first paid session.</li>
                    <li>After their session is complete, you will get <strong>50% off</strong> your next one!</li>
                </ol>
              </div>
               <Link
                to="/booking"
                className="inline-flex items-center justify-center px-8 py-3 bg-grima-primary text-white font-semibold rounded-lg hover:bg-grima-dark transition-colors duration-200"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
      </div>
    </div>
  );
};

export default CoachingPage;