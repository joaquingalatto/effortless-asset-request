"use client";

import { useWizard } from "@/lib/wizard-context";
import { WizardNavigation } from "./wizard-navigation";
import { Step1Upload } from "./step1-upload";
import { Step2GlobalFields } from "./step2-global-fields";
import { Step3AssetMapping } from "./step3-asset-mapping";
import { Step4Generate } from "./step4-generate";
import { motion, AnimatePresence } from "framer-motion";

export function WizardContainer() {
  const { state } = useWizard();

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return <Step1Upload />;
      case 2:
        return <Step2GlobalFields />;
      case 3:
        return <Step3AssetMapping />;
      case 4:
        return <Step4Generate />;
      default:
        return <Step1Upload />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <WizardNavigation />

      {/* Step Content with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
