import { Link } from "react-router-dom";
import { Brain, TrendingUp, BarChart3, Activity, ArrowRight, Zap, Shield, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-chart-blue/5" />
        <nav className="relative container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">Project Stock</span>
          </div>
          <Link to="/tracker">
            <Button variant="outline" size="sm" className="gap-2 font-mono text-xs">
              Open Tracker <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </nav>

        <div className="relative container mx-auto px-4 pt-20 pb-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground mb-6">
            <Activity className="w-3 h-3 text-primary" />
            AI-Powered Stock Predictions
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
            Real-Time Stock
            <br />
            <span className="text-primary">Market Intelligence</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg mb-8">
            Track any stock globally with live price updates, AI-driven buy/sell signals, 
            technical indicators, and predictive analytics — all in one dashboard.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/tracker">
              <Button size="lg" className="gap-2 font-bold px-8">
                <TrendingUp className="w-4 h-4" /> Start Tracking
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="gap-2 px-8">
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">Why Project Stock?</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          Combining machine learning with real-time market data for smarter decisions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: "Real-Time Data",
              desc: "Live price feeds with auto-refresh every 30 seconds. Track NSE, BSE, NASDAQ, NYSE and more.",
              color: "text-chart-yellow",
              bg: "bg-chart-yellow/10",
            },
            {
              icon: Brain,
              title: "AI Predictions",
              desc: "Hybrid ML models analyze RSI, momentum, support/resistance to generate BUY, SELL, or HOLD signals.",
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              icon: LineChart,
              title: "Technical Analysis",
              desc: "Full suite of indicators including RSI gauge, volatility meter, support & resistance levels.",
              color: "text-chart-blue",
              bg: "bg-chart-blue/10",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-colors">
              <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported Exchanges */}
      <section className="border-t border-border bg-card/30">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold mb-6">Supported Exchanges</h2>
          <div className="flex gap-6 justify-center flex-wrap text-sm font-mono text-muted-foreground">
            {["NSE", "BSE", "NASDAQ", "NYSE", "LSE", "HKEX"].map((e) => (
              <span key={e} className="px-4 py-2 rounded-lg border border-border bg-card">{e}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-12 max-w-2xl mx-auto">
          <BarChart3 className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Ready to Track Stocks?</h2>
          <p className="text-muted-foreground mb-6">Search any stock and get instant AI-powered predictions.</p>
          <Link to="/tracker">
            <Button size="lg" className="gap-2 font-bold px-10">
              <ArrowRight className="w-4 h-4" /> Open Tracker
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>Project Stock — AI-Based Stock Market Prediction</p>
        <p className="mt-1">⚠️ Academic project — predictions are for educational purposes only.</p>
      </footer>
    </div>
  );
};

export default Home;
