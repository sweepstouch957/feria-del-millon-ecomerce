"use client";
import { Check } from "lucide-react";
import styles from "./aplicar.module.css";

interface ApplicationStepperProps {
  labels: string[];
  current: number;
}

/**
 * Visual progress stepper — renders numbered dots with connectors.
 * Pure presentational, zero business logic.
 */
export function ApplicationStepper({ labels, current }: ApplicationStepperProps) {
  return (
    <div className={styles.stepper}>
      {labels.map((label, i) => {
        const cls = [
          styles.step,
          i === current ? styles.stepActive : "",
          i < current ? styles.stepDone : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div key={i} className={cls}>
            <div className={styles.stepDot}>{i < current ? <Check size={16} /> : i + 1}</div>
            <span className={styles.stepLabel}>{label}</span>
            {i < labels.length - 1 && <div className={styles.stepConnector} />}
          </div>
        );
      })}
    </div>
  );
}
