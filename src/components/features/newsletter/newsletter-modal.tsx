"use client";

import { useEffect, useState } from "react";
import { Sparkles, X, Mail, Check } from "lucide-react";

export function NewsletterModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const hasDismissed = localStorage.getItem("bengali_doc_newsletter_dismissed");
    if (!hasDismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 10000); // Popup after 10 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("bengali_doc_newsletter_dismissed", "true");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      handleClose();
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300">
      <div className="relative w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white mx-auto shadow-lg">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold font-heading">বাংলা সাহিত্যের ইতিহাসপ্রেমী?</h3>
          <p className="text-xs text-muted-foreground font-body leading-relaxed">
            ইনস্টাগ্রাম রিলসের বিস্তৃত গল্প ও প্রামাণ্য ইতিহাস মিস করবেন না। আমাদের সাপ্তাহিক নিউজলেটারে যুক্ত হোন।
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
            <Check className="w-6 h-6 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold font-heading text-emerald-600">অভিনন্দন! আপনি সাবস্ক্রাইব করেছেন।</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="আপনার ইমেইল অ্যাড্রেস লিখুন..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background border border-border text-xs focus:outline-hidden focus:ring-1 focus:ring-primary font-heading"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-heading font-bold text-xs shadow-md hover:shadow-lg transition-all"
            >
              বিনামূল্যে সাবস্ক্রাইব করুন
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
