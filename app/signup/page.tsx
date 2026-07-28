"use client";

import React from "react";
import { SignUp } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50/50 via-white to-green-50/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-12 h-12 rounded-xl bg-gradient-to-tr from-green-400 to-blue-500 flex items-center justify-center shadow-lg mb-4"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>
        
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
          Create LifeTrack Account
        </h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="shadow-xl rounded-2xl overflow-hidden"
        >
          <SignUp 
            routing="hash"
            signInUrl="/login" 
            forceRedirectUrl="/onboarding"
          />
        </motion.div>
      </div>
    </div>
  );
}
