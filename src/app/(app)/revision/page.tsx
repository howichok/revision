"use client";

import { motion } from "framer-motion";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/revision/revision-subnav";
import { PracticeHub } from "@/components/revision/practice-hub";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

export default function RevisionPage() {
  return (
    <PageContainer size="md">
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={fadeUp} custom={0}>
          <RevisionSubnav />
        </motion.div>

        <motion.div variants={fadeUp} custom={1}>
          <PracticeHub />
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
