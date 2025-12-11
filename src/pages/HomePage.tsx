import React, { useState, useMemo } from 'react'; // Added useMemo
import { Link } from 'react-router-dom';
import { ArrowRight, DollarSign, TrendingUp, Shield, Users, Brain, Target, CheckCircle, BarChart2, Search, Plus, Minus, Zap, FlaskConical, PiggyBank, CreditCard, Landmark, LineChart, Handshake, Info } from 'lucide-react'; // Added Info for CTA/Image placeholder guidance
import Citation from '../components/Citation'; 

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 py-3"> {/* Smaller padding */}
            <button
                type="button" // Ensure this is type="button" to prevent form submission issues
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left text-sm md:text-base font-semibold text-gray-800" // Smaller font size
            >
                <span>{question}</span>
                {isOpen ? <Minus className="h-4 w-4 text-grima-primary" /> : <Plus className="h-4 w-4 text-gray-400" />} {/* Smaller icon size */}
            </button>
            {isOpen && (
                <div className="mt-2 text-gray-600 text-xs"> {/* Smaller font size for answer */}
                    <p>{answer}</p>
                </div>
            )}
        </div>
    )
}


const HomePage = () => {
  const whyChooseFeatures = [
    {
      icon: <Shield size={36} className="text-grima-primary" />,
      title: "Unbiased Advice",
      description: "Get honest, independent guidance, free from sales pitches or commissions. Your interests come first."
    },
     {
      icon: <DollarSign size={36} className="text-grima-primary" />,
      title: "Affordable Access",
      description: "Expert financial coaching made accessible with transparent, budget-friendly pricing models."
    },
    {
      icon: <Users size={36} className="text-grima-primary" />,
      title: "Personalized Approach",
      description: "Receive tailored strategies and support that uniquely fit your individual financial situation and goals."
    },
     {
      icon: <Target size={36} className="text-grima-primary" />,
      title: "Practical Strategies",
      description: "Gain actionable tools, customizable templates, and real-world techniques you can apply immediately."
    }
  ];

    const approachPillars = [
    { 
      icon: <BarChart2 size={36} className="text-grima-primary" />, 
      title: "Assessment-Based Guidance", 
      text: "Utilize financial literacy and stress assessments to quantify your progress and track measurable results."
    },
    { 
      icon: <Handshake size={36} className="text-grima-primary" />, 
      title: "Client-Centered Personalized Support", 
      text: "Experience tailored support in a safe space, collaboratively addressing your unique financial needs."
    },
    { 
      icon: <Zap size={36} className="text-grima-primary" />, 
      title: "Action-Oriented & Relevant", 
      text: "Equipping you with immediately relevant information and actionable strategies you can apply today."
    },
    { 
      icon: <FlaskConical size={36} className="text-grima-primary" />,
      title: "Integrated Tools & Psychology", 
      text: "Access practical financial tools & templates, combined with strategies to enhance decision-making & reduce anxiety."
    },
  ];

  
  const faqs = [
    {
        question: "What is the main purpose of the free Initial Consultation?",
        answer: "The Initial Consultation is a comprehensive, assessment-based session designed to gauge your current financial situation, identify your key goals, and create a personalized action plan. It's the perfect starting point for our coaching journey."
    },
    {
        question: "Is this financial advice?",
        answer: "No. The services provided are for educational and coaching purposes only. As we are not licensed financial advisors, we do not provide specific recommendations on investments or other financial products. Our goal is to empower you with knowledge and strategies to make your own informed decisions."
    },
    {
        question: "Who is this service best for?",
        answer: "Our services are specifically designed for young Canadians, typically between the ages of 15 and 25, who want to build a strong foundation in personal finance. This includes high school students, university/college students, and young professionals."
    },
    {
        question: "Is the information I share in sessions confidential?",
        answer: "Absolutely. Your trust is our top priority. All personal and financial information you share during our sessions is kept strictly confidential and will never be shared without your explicit consent, unless required by law."
    },
    {
        question: "How long does each coaching session last?",
        answer: "Session durations vary based on the service. Our Initial Consultation is typically 60 minutes. Other paid coaching sessions generally range from 30 to 60 minutes. Details are on the Coaching Services page."
    },
    {
        question: "How do payments work?",
        answer: "No upfront payment is required. Payment for paid sessions is arranged directly with your coach at the end of each session. We accept various common methods."
    },
    {
        question: "Can I book multiple sessions in advance?",
        answer: "Yes, but an Initial Consultation is required first. All scheduled appointments are visible on your dashboard."
    }
  ];


  const citations = {
    1: { text: "Sokic, N. (2024, October 22). 84% of Canadians feel they lack in financial education. Money.ca. Retrieved from https://money.ca/news/canadians-lack-financial-education", url: "https://money.ca/news/canadians-lack-financial-education" },
    2: { text: "Kennedy, J. (2024, November 12). High schoolers falling behind on financial literacy. CPA Canada. Retrieved from https://www.cpacanada.ca/news/features/high-school-finance", url: "https://www.cpacanada.ca/news/features/high-school-finance" },
    3: { text: "Waberi, O. (2024, February 13). So many Canadians lack financial literacy skills: Survey says only 3% could break down common banking acronyms like TFSA, RSP and GIC. NOW Toronto. Retrieved from https://nowtoronto.com/lifestyle/survey-says-only-3-per-cent-of-canadians-could-break-down-common-banking-acronyms/", url: "https://nowtoronto.com/lifestyle/survey-says-only-3-per-cent-of-canadians-could-break-down-common-banking-acronyms/" },
    4: { text: "Financial Consumer Agency of Canada. (2025, April 1). Financial stress and its impacts. Retrieved from https://www.canada.ca/en/financial-consumer-agency/services/financial-wellness-work/stress-impacts.html", url: "https://www.canada.ca/en/financial-consumer-agency/services/financial-wellness-work/stress-impacts.html" },
    5: { text: "Henry, C., Shimoda, M., & Rusu, D. (2024, July 2). 2023 methods-of-payment survey report: The resilience of cash. Bank of Canada. Retrieved from https://www.bankofcanada.ca/wp-content/uploads/2024/07/sdp2024-8.pdf", url: "https://www.bankofcanada.ca/wp-content/uploads/2024/07/sdp2024-8.pdf" }
  };

  // Convert fractional/decimal stats to percentages and prepare for sorting
  const processAndSortStats = useMemo(() => {
    const rawStats = [
      { id: 1, value: (2/3) * 100, label: "of Canadians never receive formal financial education", originalCitation: 1 },
      { id: 2, value: 73, label: "of high schoolers report wanting to learn more about how to manage their money", originalCitation: 2 },
      { id: 3, value: 97, label: "of Canadians can't define basic banking terms", originalCitation: 3 },
      { id: 4, value: (1/3) * 100, label: "of Canadians are short on money at the end of each month", originalCitation: 4 },
      { id: 5, value: 50, label: "of Canadians report having lost sleep due to financial worries", originalCitation: 4 }, // Same citation as above
      { id: 6, value: 44, label: "of payments are made with cash or debit cards", originalCitation: 5 }
    ];

    // Sort by value (percentage) in descending order
    rawStats.sort((a, b) => b.value - a.value);

    // Create a mapping for displayed citation indices
    const displayedCitationIndices = new Map<number, number>(); // Map original citation ID to new sequential index
    let currentDisplayedIndex = 1;

    const formattedStats = rawStats.map(stat => {
        let citationToDisplay = stat.originalCitation;
        
        // If this original citation ID hasn't been mapped yet, assign a new one
        if (!displayedCitationIndices.has(stat.originalCitation)) {
            displayedCitationIndices.set(stat.originalCitation, currentDisplayedIndex);
            currentDisplayedIndex++;
        }
        // Use the mapped displayed index
        citationToDisplay = displayedCitationIndices.get(stat.originalCitation)!;

        return {
            number: `${Math.round(stat.value)}%`, 
            label: stat.label,
            citation: citationToDisplay // This is the sequential number displayed
        };
    });

    return formattedStats;
  }, []); // Only run once on mount


  return (
    <div>
      {/* Hero Section */}
      <section className="bg-grima-50 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Take a Step Towards <span className="text-grima-primary">Financial Freedom</span>
            </h1>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
                {/* Text removed as requested */}
            </p>
            
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto mb-12 border-l-4 border-grima-primary">
              <p className="text-lg text-gray-700 italic mb-4">
                "People spend about a third of their lives at work, with the far majority doing so for income alone, and not for passion. Yet, a lot of people don't know—or even are unaware that they don't know—how to effectively manage the money they've worked so hard for."
              </p>
              <p className="text-grima-primary font-semibold">— Jacob Grima, Founder</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/booking"
                className="bg-grima-primary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-grima-dark transition-colors duration-200 flex items-center justify-center"
              >
                Get Your Free Initial Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/coaching"
                className="border-2 border-grima-primary text-grima-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-grima-primary hover:text-white transition-colors duration-200"
              >
                View Coaching Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statistics */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              The Personal Finance Issue in Canada
            </h2>
            {/* Removed the subheading */}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 md:gap-x-8 md:gap-y-16">
            {/* Iterating through the processed and sorted stats array */}
            {processAndSortStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-grima-primary mb-3">{stat.number}</div>
                <div className="text-gray-600 text-base">
                  {stat.label}
                  {/* Access original citation data based on stat.citation (which maps back to the original source) */}
                  <Citation number={stat.citation} url={citations[stat.citation as keyof typeof citations].url}>
                    {citations[stat.citation as keyof typeof citations].text}
                  </Citation>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Grima Financial? Section - Redesigned for bigger points, modern look */}
       <section className="bg-grima-50 py-20 md:py-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
                {/* Left Column for optional image (currently placeholder) */}
                <div className="md:col-span-1 min-h-[300px] md:min-h-[450px] flex items-center justify-center p-6">
                    {/* Placeholder for a large image - Replace 'src' with your image path. Adjust classes as needed for your image */}
                    {/* For actual image: <img src="/path/to/your/image.jpg" alt="Why Grima Financial" className="w-full h-full object-cover rounded-lg shadow-xl" /> */}
                    {/* Placeholder div with text for now: */}
                    <div className="w-full h-full bg-gray-200 rounded-lg shadow-xl flex items-center justify-center text-gray-500 italic border-2 border-dashed border-gray-400">
                        <Info size={40} className="text-gray-400 opacity-70" />
                        <p className="ml-3 text-lg">Your Image Here</p>
                    </div>
                </div>

                {/* Right Column for text content and features - Text content aligns right now */}
                <div className="md:col-span-1 text-center md:text-right"> {/* Aligns text to the right on md and up */}
                    <div className="mb-10 md:mb-12">
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                            Why Grima Financial?
                        </h2>
                    </div>
                    {/* Feature grid content - align children based on parent text alignment */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6"> {/* Subgrid for features */}
                        {whyChooseFeatures.map((feature) => (
                        <div key={feature.title} className="text-center sm:text-right flex flex-col items-center sm:items-end transition-all duration-300 hover:-translate-y-1"> {/* Aligns children right */}
                            <div className="flex-shrink-0 mb-3">
                                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border-2 border-grima-200 shadow-md">
                                    {feature.icon}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                            <p className="mt-1 text-gray-600 text-sm">{feature.description}</p>
                        </div>
                        ))}
                    </div>
                </div>
            </div>
      </section>
      
       {/* Our Approach Section - Redesigned */}
       <section className="py-20 md:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
             {/* Left Column for Approach Pillars */}
             <div className="md:col-span-1 order-last md:order-first"> {/* Order changed for desktop layout */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6">
                     {approachPillars.map((pillar) => (
                        <div key={pillar.title} className="bg-grima-50 p-6 rounded-lg shadow-md border border-grima-100 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                            <div className="flex-shrink-0 w-16 h-16 bg-white rounded-full flex items-center justify-center border-2 border-grima-200 mb-4">
                                {/* Icons guaranteed to fit within the 16x16 circular bubble with size=36 lucide icons */}
                                {pillar.icon}
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">{pillar.title}</h3>
                            <p className="text-gray-700 leading-relaxed text-sm">{pillar.text}</p>
                        </div>
                    ))}
                </div>
            </div>
            {/* Right Column for text content */}
             <div className="md:col-span-1 text-center md:text-right"> {/* Text aligned right on desktop */}
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Built For Effective Financial Learning</h2>
            </div>
          </div>
       </section>

      {/* Coaching Services - Redesigned with 4 examples */}
      <section className="py-20 md:py-32 bg-grima-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 md:gap-20 items-start"> {/* Align items-start for consistent top */}
          {/* Left Column for Title, Intro, and Image */}
          <div className="md:col-span-1 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Coaching Services
            </h2>
            <p className="text-lg text-gray-600 max-w-xl md:max-w-none mx-auto md:mx-0 mb-8"> {/* Added mb-8 for spacing below text */}
              Immediately-relevant topics designed to help young Canadians take control of their finances.
            </p>
            {/* New: Placeholder for an image below the title and description */}
            <div className="min-h-[200px] md:min-h-[300px] flex items-center justify-center p-6 mb-8">
                 {/* Placeholder for your image - Replace 'src' with your image path. Adjust classes as needed for your image */}
                {/* For actual image: <img src="/path/to/your/coaching-section-image.jpg" alt="Coaching Services Visual" className="w-full h-full object-cover rounded-lg shadow-xl" /> */}
                {/* Placeholder div with text for now: */}
                <div className="w-full h-full bg-gray-200 rounded-lg shadow-md flex items-center justify-center text-gray-500 italic border-2 border-dashed border-gray-400">
                    <Info size={40} className="text-gray-400 opacity-70" />
                    <p className="ml-3 text-lg">Your Coaching Image Here</p>
                </div>
            </div>

            <Link
              to="/coaching"
              className="inline-block bg-grima-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-grima-dark transition-colors duration-200" /* Changed to lighter green bg-grima-primary */
            >
              View All Coaching Services
            </Link>
          </div>

          {/* Right Column for the 4 service cards */}
          <div className="md:col-span-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Initial Consultation */}
            <Link to="/booking" className="block bg-white rounded-lg shadow-md border-2 border-grima-primary p-6 text-center flex flex-col justify-between transform transition-transform hover:scale-102 group cursor-pointer">
              <div>
                <span className="inline-block bg-grima-primary text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">Start Here</span>
                <Landmark size={40} className="text-grima-primary mx-auto mb-4 group-hover:scale-105 transition-transform" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Initial Consultation</h3>
                <p className="text-3xl font-bold text-grima-primary mb-2">FREE</p>
                <p className="text-gray-600 text-sm mb-4">A comprehensive, assessment-based session to gauge your financial situation and set clear goals.</p>
              </div>
              <div className="inline-flex items-center justify-center mt-auto text-grima-primary font-medium group-hover:text-grima-dark">
                Book Now →
              </div>
            </Link>

            {/* Credit Cards */}
            <Link to="/coaching" className="block bg-white rounded-lg shadow-md border p-6 text-center flex flex-col justify-between transform transition-transform hover:scale-102 group cursor-pointer">
                <div>
                    <CreditCard size={40} className="text-grima-primary mx-auto mb-4 group-hover:scale-105 transition-transform" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Credit Cards</h3>
                    <p className="text-3xl font-bold text-grima-primary mb-2">$30</p>
                    <p className="text-gray-600 text-sm mb-4">Learn how to strategically use credit cards for rewards, credit building, and debt prevention.</p>
                </div>
                <div className="inline-flex items-center justify-center mt-auto text-grima-primary font-medium group-hover:text-grima-dark">
                    Learn More →
                </div>
            </Link>

            {/* Investing */}
            <Link to="/coaching" className="block bg-white rounded-lg shadow-md border p-6 text-center flex flex-col justify-between transform transition-transform hover:scale-102 group cursor-pointer">
                <div>
                    <LineChart size={40} className="text-grima-primary mx-auto mb-4 group-hover:scale-105 transition-transform" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Investing</h3>
                    <p className="text-3xl font-bold text-grima-primary mb-2">$30</p>
                    <p className="text-gray-600 text-sm mb-4">Demystify investing concepts, explore various investment types, and understand risk tolerance for long-term growth.</p>
                </div>
                <div className="inline-flex items-center justify-center mt-auto text-grima-primary font-medium group-hover:text-grima-dark">
                    Learn More →
                </div>
            </Link>

            {/* Taxes */}
            <Link to="/coaching" className="block bg-white rounded-lg shadow-md border p-6 text-center flex flex-col justify-between transform transition-transform hover:scale-102 group cursor-pointer">
                <div>
                    <PiggyBank size={40} className="text-grima-primary mx-auto mb-4 group-hover:scale-105 transition-transform" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Taxes & Accounts</h3>
                    <p className="text-3xl font-bold text-grima-primary mb-2">$30</p>
                    <p className="text-gray-600 text-sm mb-4">Gain a basic understanding of Canadian tax fundamentals and navigate different account types to optimize your finances.</p>
                </div>
                <div className="inline-flex items-center justify-center mt-auto text-grima-primary font-medium group-hover:text-grima-dark">
                    Learn More →
                </div>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
       <section className="py-12 bg-white"> {/* Smaller padding */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12"> {/* Adjusted margin */}
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>
            <div className="space-y-1"> {/* Smallest space between items */}
                {faqs.map(faq => <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />)}
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-grima-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-xl text-grima-100 mb-8 max-w-2xl mx-auto">
            Start with a free assessment session and discover how personalized financial coaching 
            can transform your relationship with money.
          </p>
          <Link
            to="/booking"
            className="bg-white text-grima-dark px-8 py-4 rounded-lg font-semibold text-lg hover:bg-grima-100 transition-colors duration-200 inline-flex items-center"
          >
            Book Your Free Initial Consultation
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;