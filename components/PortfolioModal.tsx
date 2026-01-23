"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function PortfolioModal({
  open,
  onClose,
  images,
}: {
  open: boolean;
  onClose: () => void;
  images: any[];
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25 }}
          >
            <h3 className="text-sm font-medium mb-4">
              Portfolio
            </h3>

            <div className="columns-2 gap-3 space-y-3">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img.publicUrl}
                  className="w-full rounded-xl"
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}