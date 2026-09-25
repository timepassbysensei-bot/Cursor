import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";

/**
 * Keyed on the pathname, so navigating remounts the page with a short
 * fade-and-lift. Deliberately short (0.3s) and never blocking: an exit
 * animation would delay the new page and make the site feel slow.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const reduced = useReducedMotion();

  if (reduced) return <div>{children}</div>;

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
