
"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

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
    question: "Setzt Ihr Unternehmen KI-Systeme ein oder stellt diese auf dem EU-Markt bereit, verkauft sie oder nimmt sie in Betrieb?",
    options: [
      { label: "Ja, wir entwickeln, betreiben oder verkaufen KI-Systeme.", value: "yes" },
      { label: "Nein, wir nutzen keine KI.", value: "no" },
      { label: "Ich bin mir nicht sicher.", value: "unsure" },
    ],
  },
  {
    id: "q2",
    title: "Verbotene Praktiken (Art. 5)",
    question: "Nutzt Ihr KI-System Techniken, die das Verhalten von Personen manipulieren, um deren Fähigkeit zu einer informierten Entscheidung zu beeinträchtigen (unterschwellige Beeinflussung)?",
    options: [
      { label: "Ja", value: "yes_forbidden" },
      { label: "Nein", value: "no" },
    ],
  },
  {
    id: "q3",
    title: "Verbotene Praktiken (Art. 5)",
    question: "Nutzt Ihr KI-System 'Social Scoring', also die Bewertung von Personen basierend auf ihrem sozialen Verhalten, was zu einer ungerechtfertigten Benachteiligung führt?",
     options: [
      { label: "Ja", value: "yes_forbidden" },
      { label: "Nein", value: "no" },
    ],
  },
  {
    id: "q4",
    title: "Echtzeit-Fernidentifizierung (Art. 5)",
    question: "Verwendet Ihr System biometrische Daten zur Echtzeit-Fernidentifizierung von Personen in öffentlich zugänglichen Räumen (z.B. öffentliche Videoüberwachung mit Gesichtserkennung)?",
    options: [
      { label: "Ja, für Strafverfolgungszwecke unter richterlicher Genehmigung.", value: "yes_law_enforcement" },
      { label: "Ja, für andere Zwecke.", value: "yes_forbidden" },
      { label: "Nein", value: "no" },
    ],
  },
  {
    id: "q5",
    title: "Hochrisiko-System: Kritische Infrastruktur",
    question: "Wird Ihr KI-System zur Steuerung oder als Sicherheitskomponente in kritischen Infrastrukturen wie Wasser-, Gas-, Stromversorgung oder im Verkehr eingesetzt?",
    options: [
      { label: "Ja", value: "yes_high_risk" },
      { label: "Nein", value: "no" },
    ],
  },
  {
    id: "q6",
    title: "Hochrisiko-System: Personalwesen",
    question: "Trifft Ihr KI-System Entscheidungen im Personalbereich, z.B. bei der Auswahl von Bewerbern, bei Beförderungen oder Kündigungen?",
    options: [
      { label: "Ja", value: "yes_high_risk" },
      { label: "Nein", value: "no" },
    ],
  },
   {
    id: "q7",
    title: "Hochrisiko-System: Zugang zu Leistungen",
    question: "Entscheidet Ihr KI-System über den Zugang zu wesentlichen privaten oder öffentlichen Dienstleistungen, wie z.B. die Kreditwürdigkeitsprüfung für einen Kredit?",
    options: [
      { label: "Ja", value: "yes_high_risk" },
      { label: "Nein", value: "no" },
    ],
  },
];

type Answers = Record<string, string>;

export function AssessmentWizard() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const router = useRouter();

  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Save answers to localStorage
      localStorage.setItem('assessmentAnswers', JSON.stringify(answers));
      setIsCompleted(true);
      router.push('/dashboard');
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
                <CardTitle>Bewertung wird verarbeitet...</CardTitle>
                <CardDescription>
                Ihre Antworten werden analysiert. Sie werden jetzt zum Dashboard weitergeleitet.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>Bitte warten Sie einen Moment.</p>
            </CardContent>
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
              className="space-y-2"
            >
              {currentQuestion.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2 p-3 rounded-md border border-transparent hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary transition-all">
                  <RadioGroupItem value={option.value} id={`${currentQuestion.id}-${option.value}`} />
                  <Label htmlFor={`${currentQuestion.id}-${option.value}`} className="flex-1 cursor-pointer">{option.label}</Label>
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
          {step === questions.length - 1 ? "Bewertung abschliessen & zum Dashboard" : "Weiter"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
