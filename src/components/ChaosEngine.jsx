import { useEffect, useState } from "react";
import Toast from "./ui/Toast";
import { getRandomChaosQuote } from "../utils/quotes";

/**
 * Easter Egg Chaos Engine
 * Triggers unpredictable UI chaos like toasts, floating elements, or alerts at random intervals.
 */
export default function ChaosEngine() {
  const [toast, setToast] = useState(null);
  const [floatingText, setFloatingText] = useState(null);

  useEffect(() => {
    const chaosInterval = setInterval(() => {
      // 50% chance to do something every 2 seconds
      if (Math.random() < 0.5) {
        const action = Math.random();

        if (action < 0.5) {
          // Trigger a random error-styled toast
          setToast({ message: getRandomChaosQuote(), type: "error" });
        } else {
          // Show massive floating text across the screen for 2 seconds
          setFloatingText(getRandomChaosQuote());
          setTimeout(() => setFloatingText(null), 2500);
        }
      }
    }, 2000);

    return () => clearInterval(chaosInterval);
  }, []);

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={4000}
        />
      )}

      {floatingText && (
        <div style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          pointerEvents: "none",
          animation: "scaleIn 0.3s cubic-bezier(.2,1,.3,1)",
        }}>
          <h1 style={{
            fontSize: "10vw",
            fontWeight: 900,
            color: "rgba(239, 68, 68, 0.2)",
            textShadow: "0 0 40px rgba(239, 68, 68, 0.4)",
            transform: `rotate(${Math.random() * 40 - 20}deg)`,
            textAlign: "center",
            direction: "rtl"
          }}>
            {floatingText}
          </h1>
        </div>
      )}
    </>
  );
}
