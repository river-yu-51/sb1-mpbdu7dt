import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

const ConsentFormPage = () => {
  const { user, signConsent } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isAgreed, setIsAgreed] = useState(false);
  const [signature, setSignature] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (user.consentSigned) return <Navigate to="/account" replace />;

  const fullName = `${user.firstName} ${user.lastName}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) return showNotification("You must agree to the terms to continue.", "error");
    if (signature.trim().toLowerCase() !== fullName.toLowerCase()) return showNotification("Signature must match your full name.", "error");

    setIsLoading(true);
    const success = await signConsent(user.id);
    if(success) {
      showNotification("Consent form signed successfully! Redirecting...", "success");
      setTimeout(() => navigate('/account'), 1500);
    } else {
      showNotification("Something went wrong. Please try again.", "error");
      setIsLoading(false);
    }
  };

  const formContent = {
    title: "Consent Form",
    welcome: { title: "Thanks & Welcome", text: "Thank you for choosing to work with me as your financial coach. I am excited to support you on your journey toward achieving your financial goals. In this document, you will find the terms and guidelines for our sessions. Please take your time to read through them carefully, and sign at the bottom to indicate your understanding and agreement." },
    sections: [
      { title: "Purpose of Financial Coaching", text: "The purpose of financial coaching is to empower you to take control of your financial well-being. My goal is to help you assess your current financial situation, explore the various strategies, develop actionable plans, and address any challenges that may arise along the way. Through this process, I aim to provide guidance, clarity, and motivation to help you achieve your financial goals. Together, we will work toward building a stronger financial foundation and a roadmap for your financial future." },
      { title: "Open Feedback Policy", text: "I believe that feedback is an essential part of any productive relationship. Whether it’s positive or constructive, your feedback helps me improve as a coach and ensures our sessions are tailored to meet your specific needs. If there’s anything you feel I could do differently or better, I encourage you to share it openly. Likewise, if something is working well for you, I’d love to know so I can continue to build on it. Your feedback doesn’t just benefit our sessions—it also helps me improve the services I provide to future clients. So please don’t hesitate to share any insights, thoughts, or suggestions at any time during our work together." },
      { title: "Theoretical Orientation and Techniques", text: "I plan to primarily use both Person-Centered and Motivational Interviewing (MI) approaches as the foundation for my coaching. These approaches focus on understanding your unique perspective, empowering you to make decisions, and enhancing your motivation to take meaningful steps toward your financial goals. In addition, I may draw from other coaching and therapy techniques where appropriate, depending on what best suits your needs. If at any point you find that the methods or techniques I’m using aren’t helpful, make you uncomfortable, or you feel I could be helping you in a better way, please let me know. I’m always open to adjusting my approach to better serve you, and I’m very open to learning from what may not be working effectively." },
      { title: "Reproduction Disclaimer", text: "You may not sell, share, or distribute any materials I provide to you without my specific prior written or verbal consent. This includes spreadsheets, documents, presentations, or any other financial coaching tools I created for coaching purposes or other reasons. This disclaimer is in place to protect my work from being exploited, profited from, or misused by others. If your intent is to use the materials as intended—solely for your personal financial growth—this will not be an issue so there’s no need to worry." },
      { title: "Note on Quality of Financial Coaching", text: "Please note that I don’t possess formal education in any areas of finance as of yet. My coaching is based on the knowledge I have gained through solely personal experience, select university courses, and self-education. I believe the quality of my financial coaching will generally fit best for those in highschool, postsecondary education (college/university), and/or are under 25. Please understand that there may be instances where I do not have the answer to certain questions. However, I will be committed to guiding you toward credible resources that can provide the information, assistance, or guidance you wish to find." },
      { title: "Acknowledgment of Non-Financial Advice", text: "The service I provide is not financial advice, as I am not a licensed financial advisor, planner, or investment specialist. I do not have the required knowledge or credentials to offer specific recommendations on investments, retirement planning, or other specific financial products or services. For financial decisions requiring specific expertise, please consult with a licensed professional in the respective field for your inquiry. The guidance I provide is intended for educational and coaching purposes only. My role is to help you understand your options, develop strategies, and reach your goals, which does not entail professional financial advice. While I may share suggestions during our sessions, please understand these are opinions based on experiences from myself and others I have learned from, and to not be interpreted as professional financial advice." },
      { title: "Confidentiality Agreement", text: "Your trust is incredibly important to me, and I am fully committed to protecting your privacy. Any personal or financial information you share with me will remain strictly confidential. I will not share any of the information you share in our sessions with anyone unless required by law or with your explicit written consent. If you are uncomfortable sharing any aspects of your financial situation please do not hesitate to say so. You are never obligated to provide any information you do not wish to disclose. My primary goal is to create a safe and supportive environment where you feel comfortable discussing your finances. Please understand that any financial information I ask you about is solely for the purpose of helping you achieve your financial goals." }
    ]
  };

  return (
    <div className="py-20 bg-grima-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{formContent.title}</h1>
          </div>

          <div className="prose prose-lg max-w-none mx-auto text-gray-700 space-y-6">
            <h2 className="!text-2xl !font-bold">{formContent.welcome.title}</h2>
            <p>{formContent.welcome.text}</p>
            {formContent.sections.map(section => (
                <div key={section.title}>
                    <h3 className="!font-semibold !text-xl">{section.title}</h3>
                    <p className="text-base">{section.text}</p>
                </div>
            ))}
            <h3 className="!font-semibold !text-xl pt-6 border-t">Acknowledgment and Agreement</h3>
            <p className="text-base">By signing below, you confirm that you have read and understand the contents in this document. You also consent to participate in financial coaching sessions with me, Jacob Grima, with the understanding that you can discontinue our sessions at any time.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="mt-12 pt-8 border-t">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Client Name</label>
                    <p className="mt-1 p-3 bg-gray-100 rounded-md">{fullName}</p>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Financial Coach Name</label>
                    <p className="mt-1 p-3 bg-gray-100 rounded-md">Jacob Grima</p>
                </div>
             </div>

             <div className="mb-8">
                 <label htmlFor="signature" className="block text-sm font-medium text-gray-700 mb-2"> Client Signature </label>
                 <input type="text" id="signature" value={signature} onChange={(e) => setSignature(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" placeholder={`Type your full name to sign: ${fullName}`} />
            </div>
             <div className="mb-8">
                <label className="flex items-center">
                    <input type="checkbox" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} className="h-5 w-5 rounded text-grima-primary focus:ring-grima-primary" />
                    <span className="ml-3 text-gray-700">I have read, understood, and agree to the terms outlined in this consent form.</span>
                </label>
             </div>
             
             <button type="submit" disabled={!isAgreed || isLoading || signature.trim().toLowerCase() !== fullName.toLowerCase()}
                className="w-full bg-grima-primary text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-grima-dark transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                <ShieldCheck className="mr-2" size={20}/>
                {isLoading ? "Submitting..." : "Sign and Submit"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default ConsentFormPage;