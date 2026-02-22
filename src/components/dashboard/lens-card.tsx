import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface LensCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    primaryLabel: string;
    primaryVariant?: "default" | "destructive" | "secondary" | "outline" | "ghost" | "link";
    onPrimary: () => void;
    progressPercent: number;
    footerText: string;
}

export function LensCard({
    title,
    description,
    icon: Icon,
    primaryLabel,
    primaryVariant = "default",
    onPrimary,
    progressPercent,
    footerText
}: LensCardProps) {
    const isError = primaryVariant === "destructive";

    return (
        <Card className="flex flex-col h-full border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
            {isError && (
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
            )}

            <CardContent className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2.5 rounded-lg border",
                            isError
                                ? "bg-red-50 border-red-100 text-red-600 dark:bg-red-950/30 dark:border-red-900/50"
                                : "bg-slate-50 border-slate-100 text-slate-700 dark:bg-slate-900 dark:border-slate-800"
                        )}>
                            <Icon className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2 mb-6">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                </div>

                <div className="mt-auto space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-600 dark:text-slate-400">{footerText}</span>
                            <span className={isError ? "text-red-600 font-bold" : "text-slate-900 dark:text-slate-100 font-bold"}>
                                {progressPercent}%
                            </span>
                        </div>
                        <Progress
                            value={progressPercent}
                            className={cn("h-1.5", isError ? "bg-red-100 dark:bg-red-950/50" : "bg-slate-100 dark:bg-slate-800")}
                            indicatorClassName={isError ? "bg-red-500" : "bg-slate-800 dark:bg-slate-200"}
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            variant={primaryVariant}
                            className="w-full justify-between group"
                            onClick={onPrimary}
                        >
                            <span className="truncate">{primaryLabel}</span>
                            <ArrowRight className="w-4 h-4 ml-2 shrink-0 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
