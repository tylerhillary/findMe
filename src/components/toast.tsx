"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

/** Shows `message` briefly whenever `trigger` changes to a new truthy value. */
export function Toast({ message, trigger }: { message?: string; trigger: unknown }) {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!trigger || !message) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
    const t = setTimeout(() => setShow(false), 2600);
    return () => clearTimeout(t);
  }, [trigger, message]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="pointer-events-none fixed inset-x-0 bottom-24 z-[200] flex justify-center lg:bottom-8"
          role="status"
        >
          <div className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-lift">
            <CheckCircle2 className="size-4.5 text-emerald-400" /> {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
