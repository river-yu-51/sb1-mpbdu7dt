import React from "react";
import Footer from "../components/Footer"; // if you have one
import FAQ from "../components/FAQ";       // we’ll make this next

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-grima-bg">
      {/* Optional */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
        <p className="text-gray-600 mt-2">
          Quick answers about Grima, sessions, privacy, and eligibility.
        </p>

        <div className="mt-6">
          <FAQ />
        </div>
      </main>

      {/* Optional */}
      <Footer />
    </div>
  );
}
