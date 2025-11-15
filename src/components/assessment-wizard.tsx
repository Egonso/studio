
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { saveAssessmentAnswers, getActiveProjectId } from "@/lib/data-service";

type QuestionId = 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q_final_compliant' | 'q_final_review';

interface Question {
    title: string;
    question: string;
    options: {
        label: string;
        value: string;
        next?: QuestionId;
    }[];
    next?: QuestionId; // Default next question if no option specifies one
}

const questions: Record<QuestionId, Question | { final: boolean, title: string, description: string }> = {
  q1: {
    title: "Anwendbarkeit des AI Acts",
    question: "Setzt Ihr Unternehmen KI-Systeme ein oder stellt diese auf dem EU-Markt bereit, verkauft sie oder nimmt sie in Betrieb?",
    options: [
      { label: "Ja, wir entwickeln, betreiben oder verkaufen KI-Systeme.", value: "yes", next: "q2" },
      { label: "Nein, wir nutzen keine KI.", value: "no", next: "q_final_compliant" },
      { label: "Ich bin mir nicht sicher.", value: "unsure", next: "q2" },
    ],
  },
  q2: {
    title: "Verbotene Praktiken (Art. 5)",
    question: "Nutzt Ihr KI-System Techniken, die das Verhalten von Personen manipulieren (z.B. unterschwellige Beeinflussung), 'Social Scoring' zur Bewertung von Personen einsetzen oder Echtzeit-Fernidentifizierung im öffentlichen Raum ohne richterliche Genehmigung durchführen?",
    options: [
        { label: "Ja, eines oder mehrere davon treffen zu.", value: "yes_forbidden" },
        { label: "Nein, nichts davon trifft zu.", value: "no" },
    ],
    next: 'q3'
  },
  q3: {
    title: "Hochrisiko-System: Kritische Infrastruktur",
    question: "Wird Ihr KI-System zur Steuerung oder als Sicherheitskomponente in kritischen Infrastrukturen wie Wasser-, Gas-, Stromversorgung oder im Verkehr eingesetzt?",
    options: [
      { label: "Ja", value: "yes_high_risk" },
      { label: "Nein", value: "no" },
    ],
    next: 'q4'
  },
  q4: {
    title: "Hochrisiko-System: Bildung / Berufliche Bildung",
    question: "Wird Ihr KI-System eingesetzt, um über den Zugang zu Bildungseinrichtungen zu entscheiden oder die Leistung von Studierenden zu bewerten (z.B. bei Prüfungen)?",
    options: [
        { label: "Ja", value: "yes_high_risk" },
        { label: "Nein", value: "no" },
    ],
    next: 'q5'
  },
  q5: {
    title: "Hochrisiko-System: Personalwesen",
    question: "Trifft Ihr KI-System Entscheidungen im Personalbereich, z.B. bei der Auswahl von Bewerbern, bei Beförderungen oder Kündigungen?",
    options: [
      { label: "Ja", value: "yes_high_risk" },
      { label: "Nein", value: "no" },
    ],
    next: 'q6'
  },
   q6: {
    title: "Hochrisiko-System: Zugang zu Leistungen",
    question: "Entscheidet Ihr KI-System über den Zugang zu wesentlichen privaten oder öffentlichen Dienstleistungen, wie z.B. die Kreditwürdigkeitsprüfung für einen Kredit?",
    options: [
      { label: "Ja", value: "yes_high_risk" },
      { label: "Nein", value: "no" },
    ],
    next: 'q7'
  },
  q7: {
      title: "Hochrisiko-System: Strafverfolgung & Biometrie",
      question: "Wird Ihr System im Bereich der Strafverfolgung eingesetzt, z.B. zur Bewertung der Zuverlässigkeit von Beweismitteln oder zur Vorhersage von Straftaten?",
      options: [
          { label: "Ja", value: "yes_high_risk" },
          { label: "Nein", value: "no" },
      ],
      next: 'q_final_review'
  },
  q_final_compliant: {
      final: true,
      title: "Kein direkter Handlungsbedarf",
      description: "Basierend auf Ihrer Antwort scheinen Sie vom EU AI Act nicht direkt betroffen zu sein. Es werden keine KI-Systeme eingesetzt. Wir leiten Sie zum Dashboard für dieses Projekt weiter, das diesen Status widerspiegelt.",
  },
  q_final_review: {
      final: true,
      title: "Bewertung abgeschlossen",
      description: "Vielen Dank. Ihre Antworten wurden für dieses Projekt aufgezeichnet. Im nächsten Schritt erfassen wir weitere Details zu Ihrem Unternehmen, um die Ratschläge zu personalisieren.",
  }
};

const questionOrder: QuestionId[] = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'];

type Answers = Record<string, string>;

export function AssessmentWizard() {
  const [stepHistory, setStepHistory] = useState<QuestionId[]>(['q1']);
  const [answers, setAnswers] = useState<Answers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const currentStepId = stepHistory[stepHistory.length - 1];
  const currentQuestionDef = questions[currentStepId];

  const handleNextStep = async (currentAnswers: Answers) => {
    const projectId = getActiveProjectId();
    if (!projectId) {
        router.push('/projects');
        return;
    }

    if ('final' in currentQuestionDef) {
        setIsSubmitting(true);
        await saveAssessmentAnswers(currentAnswers);
        if(currentStepId === 'q_final_compliant') {
            router.push(`/dashboard?projectId=${projectId}`);
        } else {
            router.push('/assessment/context');
        }
        return;
    }
    
    const value = currentAnswers[currentStepId];
    if (currentStepId === 'q1' && value === 'no') {
        setIsSubmitting(true);
        await saveAssessmentAnswers(currentAnswers);
        setStepHistory([...stepHistory, 'q_final_compliant']);
        setIsSubmitting(false);
        return;
    }
    
    const question = questions[currentStepId];
    if (!('final' in question)) {
        const selectedOption = question.options.find(o => o.value === value);
        let nextStepId = selectedOption?.next || question.next;
        
        if (!nextStepId) {
             const currentIndex = questionOrder.indexOf(currentStepId);
             if (currentIndex < questionOrder.length - 1) {
                nextStepId = questionOrder[currentIndex + 1];
             } else {
                nextStepId = 'q_final_review';
             }
        }
        setStepHistory([...stepHistory, nextStepId]);
    }
  };

  const handleAnswerChange = (value: string) => {
    const newAnswers = { ...answers, [currentStepId]: value };
    setAnswers(newAnswers);
    // Automatically proceed to the next step after a short delay to show selection
    setTimeout(() => handleNextStep(newAnswers), 150);
  };

  const handleBack = () => {
    if (stepHistory.length > 1) {
        const newHistory = [...stepHistory];
        newHistory.pop();
        setStepHistory(newHistory);
    }
  };
  
  const progress = (stepHistory.length / (questionOrder.length + 1)) * 100;

  if ('final' in currentQuestionDef) {
      return (
          <Card className="w-full max-w-2xl shadow-lg">
              <CardHeader>
                  <CardTitle>{currentQuestionDef.title}</CardTitle>
              </CardHeader>
              <CardContent>
                  <p>{currentQuestionDef.description}</p>
              </CardContent>
              <CardFooter className="flex justify-end">
                  <Button onClick={() => handleNextStep(answers)} disabled={isSubmitting}>
                      {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Weiterleiten...
                          </>
                      ) : (
                        currentStepId === 'q_final_compliant' ? 'Zum Dashboard' : 'Weiter zum Kontext'
                      )}
                  </Button>
              </CardFooter>
          </Card>
      )
  }

  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader>
        <CardTitle>Compliance-Bewertung</CardTitle>
        <CardDescription>
          Führt Sie Schritt für Schritt durch die relevanten Fragen des EU AI Acts für Ihr Projekt.
        </CardDescription>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent className="overflow-hidden min-h-[250px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepId}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="font-semibold text-lg mb-4">{currentQuestionDef.title}</h3>
            <p className="mb-6">{currentQuestionDef.question}</p>
            <RadioGroup
              onValueChange={handleAnswerChange}
              value={answers[currentStepId]}
              className="space-y-2"
            >
              {currentQuestionDef.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2 p-3 rounded-md border border-transparent hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary transition-all">
                  <RadioGroupItem value={option.value} id={`${currentStepId}-${option.value}`} />
                  <Label htmlFor={`${currentStepId}-${option.value}`} className="flex-1 cursor-pointer">{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </motion.div>
        </AnimatePresence>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={stepHistory.length <= 1}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
        </Button>
      </CardFooter>
    </Card>
  );
}
