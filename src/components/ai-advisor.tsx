"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles } from "lucide-react";

import {
  aiComplianceAdvisor,
  type AiComplianceAdvisorOutput,
} from "@/ai/flows/ai-compliance-advisor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  companyDescription: z.string().min(20, {
    message: "Company description must be at least 20 characters.",
  }),
  existingAuditData: z.string().min(20, {
    message: "Existing audit data must be at least 20 characters.",
  }),
  riskProfile: z.string().min(20, {
    message: "Risk profile must be at least 20 characters.",
  }),
});

export function AIAdvisor() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiComplianceAdvisorOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyDescription: "",
      existingAuditData: "",
      riskProfile: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await aiComplianceAdvisor(values);
      setResult(res);
    } catch (e) {
      setError("An error occurred while getting recommendations. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full shadow-lg sticky top-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-accent" />
          AI Compliance Advisor
        </CardTitle>
        <CardDescription>
          Get AI-powered recommendations to align with the EU AI Act. Describe your company, existing compliance data, and risk profile.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="companyDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your company and its main activities, especially those involving AI."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="existingAuditData"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Existing Audit & Compliance Data</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Summarize your current audit and compliance information, including data collection and processing practices."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="riskProfile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Profile</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the main compliance risks your company faces, particularly concerning AI systems."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Recommendations
            </Button>
          </CardFooter>
        </form>
      </Form>
      
      {error && (
        <div className="p-6 pt-0">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
      )}

      {result && (
        <div className="p-6 pt-0">
          <Card className="bg-secondary">
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-secondary-foreground">{result.recommendations}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}
