"use client";

interface ProgressIndicatorProps {
  currentStep: number;
  locale?: "en" | "es";
}

const STEP_LABELS = {
  en: ["Service", "Location", "Schedule", "Review", "Payment"],
  es: ["Servicio", "Ubicación", "Horario", "Revisar", "Pago"],
};

export default function ProgressIndicator({ currentStep, locale = "en" }: ProgressIndicatorProps) {
  const labels = STEP_LABELS[locale];

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-start justify-between max-w-md sm:max-w-lg mx-auto">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex flex-col items-center relative flex-1">
            {/* Connecting line */}
            {step < 5 && (
              <div
                className={`
                  absolute top-4 sm:top-5 left-1/2 h-1 transition-colors duration-300
                  ${currentStep > step ? "bg-[#D0B078]" : "bg-[#2C355E]"}
                `}
                style={{ width: "100%" }}
              />
            )}
            {/* Circle */}
            <div
              className={`
                z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
                font-bold text-xs sm:text-sm transition-all duration-300
                ${currentStep >= step
                  ? "bg-[#D0B078] text-[#131835] shadow-[0_0_15px_rgba(208,176,120,0.4)]"
                  : "bg-[#2C355E] text-[#8994B8]"
                }
              `}
            >
              {step}
            </div>
            {/* Label */}
            <span
              className={`
                mt-2 sm:mt-3 text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-center
                ${currentStep >= step ? "text-[#D0B078]" : "text-[#8994B8]"}
              `}
            >
              {labels[step - 1]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
