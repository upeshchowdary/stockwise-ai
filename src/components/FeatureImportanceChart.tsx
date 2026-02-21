import { getFeatureImportance } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const FeatureImportanceChart = () => {
  const features = getFeatureImportance();
  const colors = [
    "hsl(142, 70%, 45%)", "hsl(142, 70%, 50%)", "hsl(210, 100%, 56%)", "hsl(210, 100%, 60%)",
    "hsl(38, 92%, 50%)", "hsl(38, 92%, 55%)", "hsl(270, 60%, 60%)", "hsl(270, 60%, 65%)",
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Feature Importance (Random Forest)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={features} layout="vertical" margin={{ left: 20 }}>
          <XAxis type="number" tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={140} />
          <Tooltip contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 90%)", borderRadius: 8, color: "hsl(220, 15%, 15%)", fontFamily: "JetBrains Mono", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
          <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
            {features.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FeatureImportanceChart;
