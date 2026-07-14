import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AppLoading() {
  return (
    <div className="space-y-5">
      <Card className="border-dashed border-border/70 bg-card/80">
        <CardHeader>
          <div className="h-6 w-32 animate-pulse rounded-full bg-secondary" />
          <div className="mt-2 h-9 w-96 animate-pulse rounded-xl bg-secondary" />
          <div className="mt-1 h-5 w-72 animate-pulse rounded-lg bg-secondary" />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="h-28 animate-pulse rounded-3xl bg-secondary" />
          <div className="h-28 animate-pulse rounded-3xl bg-secondary" />
          <div className="h-28 animate-pulse rounded-3xl bg-secondary" />
        </CardContent>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-dashed border-border/70 bg-card/80">
          <CardContent className="space-y-3 p-6">
            <div className="h-5 w-28 animate-pulse rounded-full bg-secondary" />
            <div className="h-8 w-48 animate-pulse rounded-xl bg-secondary" />
            <div className="grid gap-3 pt-4 md:grid-cols-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-secondary" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed border-border/70 bg-card/80">
          <CardContent className="space-y-3 p-6">
            <div className="h-5 w-36 animate-pulse rounded-full bg-secondary" />
            <div className="space-y-3 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
