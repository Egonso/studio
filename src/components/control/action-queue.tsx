import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ControlActionRecommendation } from "@/lib/control/action-queue-engine";

interface ActionQueueProps {
  recommendations: ControlActionRecommendation[];
}

function RecommendationItem({
  recommendation,
}: {
  recommendation: ControlActionRecommendation;
}) {
  return (
    <div className="rounded-md border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-medium">{recommendation.problem}</p>
          <p className="text-xs text-muted-foreground">
            Einsatzfall: {recommendation.useCaseLabel}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Prioritaet {recommendation.priority}</p>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <p>
          <span className="font-medium">Risiko/Impact:</span>{" "}
          <span className="text-muted-foreground">{recommendation.impact}</span>
        </p>
        <p>
          <span className="font-medium">Empfohlene Aktion:</span>{" "}
          <span className="text-muted-foreground">{recommendation.recommendedAction}</span>
        </p>
      </div>

      <div className="mt-3">
        <Button asChild variant="outline" size="sm">
          <Link href={recommendation.deepLink}>
            Zum Einsatzfall
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function ActionQueue({ recommendations }: ActionQueueProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Queue</CardTitle>
        <CardDescription>
          Priorisierte Massnahmen auf Basis der Registerdaten.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Aktuell liegen keine priorisierten Massnahmen vor.
          </div>
        ) : (
          recommendations.map((recommendation) => (
            <RecommendationItem key={recommendation.id} recommendation={recommendation} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

