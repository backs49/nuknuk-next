"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FadeIn from "@/components/FadeIn";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/faq")
      .then((res) => res.json())
      .then((data) => setFaqs(data.faqs || []))
      .catch(() => {});
  }, []);

  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="section-padding bg-cream-100">
      <div className="max-w-3xl mx-auto px-5 md:px-8">
        <FadeIn>
          <div className="text-center mb-10">
            <span className="text-xs tracking-[0.3em] text-sage-400 uppercase font-medium">
              FAQ
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-charcoal-400 mt-2">
              자주 묻는 질문
            </h2>
          </div>
        </FadeIn>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FadeIn key={faq.id} delay={index * 0.05}>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() =>
                    setOpenId(openId === faq.id ? null : faq.id)
                  }
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-charcoal-400 text-sm md:text-base pr-4">
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: openId === faq.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-charcoal-200 shrink-0"
                  >
                    ▾
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openId === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-4 text-sm text-charcoal-200 leading-relaxed whitespace-pre-wrap">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.2}>
          <div className="text-center mt-8">
            <p className="text-sm text-charcoal-200">
              더 궁금한 점이 있으신가요?
            </p>
            <a
              href="http://pf.kakao.com/_paCxdn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm font-medium text-sage-400 hover:text-sage-500 transition-colors"
            >
              카카오톡으로 문의하기 →
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
