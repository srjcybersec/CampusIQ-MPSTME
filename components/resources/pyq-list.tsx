"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { PYQCard } from "./pyq-card";
import { Loader2, FileText } from "lucide-react";
import { PYQDocument } from "@/lib/types/pyqs";

interface PYQListProps {
  pyqs: PYQDocument[];
  isLoading: boolean;
}

export function PYQList({ pyqs, isLoading }: PYQListProps) {
  if (isLoading) {
    return (
      <motion.div
        className="flex items-center justify-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="w-16 h-16 bg-gradient-to-r from-[#7C7CFF] to-[#38BDF8] rounded-2xl flex items-center justify-center glow-purple"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </motion.div>
      </motion.div>
    );
  }

  if (pyqs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card variant="glass" className="relative z-10">
          <CardContent className="p-12 text-center">
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-[#22D3EE] to-[#A855F7] rounded-2xl flex items-center justify-center glow-blue mx-auto mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FileText className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No PYQs found
            </h3>
            <p className="text-[#D4D4D8]">
              Try adjusting your filters or search query
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        className="mb-4 text-sm text-[#D4D4D8]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        Showing {pyqs.length} PYQ{pyqs.length !== 1 ? "s" : ""}
      </motion.div>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {pyqs.map((pyq, index) => (
          <motion.div
            key={pyq.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="h-full w-full flex"
          >
            <PYQCard pyq={pyq} />
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}
