"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import type {
  WizardState,
  RequestJSON,
  GlobalFields,
  AssetMapping,
} from "@/lib/types";

const initialGlobalFields: GlobalFields = {
  masterKeyVisual: "",
  formatNeeded: { image: true, text: false },
  adaptationNeeded: false,
  markets: "",
  requesterName: "",
  translationLanguage: "NO APLICA",
  additionalComments: "",
};

const initialState: WizardState = {
  step: 1,
  requestJSON: null,
  globalFields: initialGlobalFields,
  assetMappings: [],
  parseErrors: [],
};

type WizardAction =
  | { type: "SET_STEP"; payload: number }
  | { type: "SET_REQUEST_JSON"; payload: RequestJSON }
  | { type: "SET_PARSE_ERRORS"; payload: string[] }
  | { type: "SET_GLOBAL_FIELDS"; payload: Partial<GlobalFields> }
  | { type: "SET_ASSET_MAPPINGS"; payload: AssetMapping[] }
  | { type: "UPDATE_ASSET_MAPPING"; payload: { index: number; data: Partial<AssetMapping> } }
  | { type: "RESET" };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "SET_REQUEST_JSON":
      return { ...state, requestJSON: action.payload, parseErrors: [] };
    case "SET_PARSE_ERRORS":
      return { ...state, parseErrors: action.payload };
    case "SET_GLOBAL_FIELDS":
      return {
        ...state,
        globalFields: { ...state.globalFields, ...action.payload },
      };
    case "SET_ASSET_MAPPINGS":
      return { ...state, assetMappings: action.payload };
    case "UPDATE_ASSET_MAPPING": {
      const newMappings = [...state.assetMappings];
      newMappings[action.payload.index] = {
        ...newMappings[action.payload.index],
        ...action.payload.data,
      };
      return { ...state, assetMappings: newMappings };
    }
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface WizardContextType {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
}

const WizardContext = createContext<WizardContextType | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const nextStep = () => {
    if (state.step < 4) {
      dispatch({ type: "SET_STEP", payload: state.step + 1 });
    }
  };

  const prevStep = () => {
    if (state.step > 1) {
      dispatch({ type: "SET_STEP", payload: state.step - 1 });
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 4) {
      dispatch({ type: "SET_STEP", payload: step });
    }
  };

  return (
    <WizardContext.Provider value={{ state, dispatch, nextStep, prevStep, goToStep }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
