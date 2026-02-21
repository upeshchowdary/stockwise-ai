import { getModelMetrics } from "@/lib/mockData";

const ModelComparison = () => {
  const models = getModelMetrics();

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Model Comparison</h3>
      <div className="grid grid-cols-2 gap-4">
        {models.map((m) => (
          <div key={m.name} className="rounded-md border border-border bg-secondary/30 p-4 space-y-3">
            <h4 className="font-semibold text-sm">{m.name}</h4>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {(["accuracy", "precision", "recall", "f1"] as const).map((k) => (
                <div key={k}>
                  <p className="text-xs text-muted-foreground capitalize">{k === "f1" ? "F1 Score" : k}</p>
                  <p className="font-bold text-foreground">{(m[k] * 100).toFixed(1)}%</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Confusion Matrix</p>
              <div className="grid grid-cols-2 gap-1 w-fit">
                {m.confusionMatrix.flat().map((v, i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 flex items-center justify-center rounded text-xs font-mono font-bold ${
                      i === 0 || i === 3 ? "bg-buy text-buy" : "bg-sell text-sell"
                    }`}
                  >
                    {v}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelComparison;
