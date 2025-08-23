"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

const questions = [
  {
    id: "q1",
    title: "Anwendbarkeit des AI Acts",
    question:
      "Setzt Ihr Unternehmen KI-Systeme ein oder stellt diese auf dem EU-Markt bereit?",
    options: [
      { label: "Ja, wir entwickeln oder betreiben KI-Systeme.", value: "yes" },
      { label: "Nein, wir nutzen keine KI.", value: "no" },
      {
        label: "Ich bin mir nicht sicher.",
        value: "unsure",
      },
    ],
  },
  {
    id: "q2",
    title: "Einsatzbereich der KI",
    question:
      "In welchem der folgenden Bereiche wird Ihr KI-System hauptsächlich eingesetzt?",
    options: [
      {
        label: "Personalwesen (z.B. Bewerber-Screening, Beförderungsentscheidungen)",
        value: "hr",
      },
      {
        label: "Kritische Infrastruktur (z.B. Wasser-, Gas-, Stromversorgung)",
        value: "infrastructure",
      },
      {
        label: "Medizinprodukte oder Gesundheitswesen",
        value: "medical",
      },
      {
        label: "Keiner der oben genannten Bereiche",
        value: "none",
      },
    ],
  },
  {
    id: "q3",
    title: "Biometrische Daten",
    question:
      "Verarbeitet Ihr KI-System biometrische Daten zur Identifizierung von Personen in Echtzeit an öffentlich zugänglichen Orten?",
    options: [
      { label: "Ja", value: "yes" },
      { label: "Nein", value: "no" },
    ],
  },
];

type Answers = Record<string, string>;

export function AssessmentWizard() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = questions[step];
  const progress = (step / questions.length) * 100;

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleAnswerChange = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const isCurrentStepAnswered = () => {
    return answers.hasOwnProperty(currentQuestion.id);
  };
  
  if (isCompleted) {
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>Bewertung abgeschlossen</CardTitle>
                <CardDescription>
                Ihre ersten Antworten wurden gespeichert. Auf dem Dashboard sehen Sie eine Zusammenfassung und die nächsten Schritte.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>Basierend auf Ihren Antworten wird Ihr KI-System nun analysiert. Das Ergebnis finden Sie in Ihrem persönlichen Dashboard.</p>
            </CardContent>
            <CardFooter>
                 <Link href="/dashboard" className="w-full">
                    <Button className="w-full">Zum Dashboard</Button>
                </Link>
            </CardFooter>
        </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl shadow-2xl">
      <CardHeader>
        <CardTitle>Compliance-Bewertung</CardTitle>
        <CardDescription>
          Schritt {step + 1} von {questions.length}
        </CardDescription>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent className="overflow-hidden min-h-[250px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="font-semibold text-lg mb-4">{currentQuestion.title}</h3>
            <p className="mb-6">{currentQuestion.question}</p>
            <RadioGroup
              onValueChange={handleAnswerChange}
              value={answers[currentQuestion.id]}
            >
              {currentQuestion.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </motion.div>
        </AnimatePresence>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={step === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
        </Button>
        <Button onClick={handleNext} disabled={!isCurrentStepAnswered()}>
          {step === questions.length - 1 ? "Abschliessen" : "Weiter"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
