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
    <div className="mb-12">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex items-center w-full relative">
            <div
              className={`
                z-10 w-10 h-10 rounded-full flex items-center justify-center
                font-bold text-sm transition-all duration-300
                ${currentStep >= step
                  ? "bg-[#D0B078] text-[#131835] shadow-[0_0_15px_rgba(208,176,120,0.4)]"
                  : "bg-[#2C355E] text-[#5E698F]"
                }
              `}
            >
              {step}
            </div>
            {step < 5 && (
              <div
                className={`
                  absolute left-5 right-0 top-1/2 -mt-[2px] h-1 transition-colors duration-300
                  ${currentStep > step ? "bg-[#D0B078]" : "bg-[#2C355E]"}
                `}
                style={{ width: "calc(100% - 1.25rem)" }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between max-w-3xl mx-auto mt-3 text-xs uppercase tracking-wider font-semibold">
        {labels.map((label, i) => (
          <span
            key={label}
            className={currentStep >= i + 1 ? "text-[#D0B078]" : "text-[#5E698F]"}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
