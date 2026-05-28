"use client";

import { useState } from "react";
import Link from "next/link";
import { HardHat, UtensilsCrossed, Stethoscope, PawPrint, BarChart3, MessageCircle, ShieldCheck, Clock, MapPin, ArrowUpRight, X } from "lucide-react";
import heroImg from "@/assets/hero-columns.jpg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

const agents = [
  {
    name: "Materiais",
    tag: "Construção & Reformas",
    desc: "Cotação rápida, lista de materiais e agendamento de entrega por bairro.",
    icon: HardHat,
    accent: "from-amber-400/30 to-amber-600/0",
    gptId: "3E721790B13ED228D55A6E943545A768",
  },
  {
    name: "Gastronomia",
    tag: "Restaurantes & Delivery",
    desc: "Pedidos, cardápio e logística de entrega com captura de endereço.",
    icon: UtensilsCrossed,
    accent: "from-rose-400/30 to-rose-600/0",
    gptId: "3E85F2A3DA4031A6D17E8A7F6D386327",
  },
  {
    name: "Produtos Médicos",
    tag: "Clínicas & Distribuidores",
    desc: "Pré-triagem, agendamento de consulta e consentimento LGPD.",
    icon: Stethoscope,
    accent: "from-sky-400/30 to-sky-600/0",
    gptId: "3E7AED03B65722FAB7D54E3016F89FC4",
  },
  {
    name: "Pet Shop / Vet",
    tag: "Animais & Veterinária",
    desc: "Banho, tosa e consulta veterinária com lembretes automáticos.",
    icon: PawPrint,
    accent: "from-violet-400/30 to-violet-600/0",
    gptId: "3E73006DA89662ED5593FE792A068AF7",
  },
];

export default function Index() {
  const [activeAgent, setActiveAgent] = useState<typeof agents[0] | null>(null)

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0">
        <img
          src={heroImg.src}
          alt=""
          width={1920}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover opacity-30 dark:opacity-60"
        />
        <div className="absolute inset-0 bg-grid opacity-20 dark:opacity-40" />
        <div className="absolute inset-x-0 top-0 h-[70vh]" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: '#000', border: '2px solid #2E8B57' }}>
            <MessageCircle className="h-5 w-5" style={{ color: '#2E8B57' }} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            Atend<span style={{ color: '#2E8B57' }}>Zap</span>
          </span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#agentes" className="hover:text-foreground transition-colors">Agentes</a>
          <a href="#crm" className="hover:text-foreground transition-colors">CRM</a>
          <a href="#seguranca" className="hover:text-foreground transition-colors">Segurança</a>
        </nav>
        <ThemeSwitcher />
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/20"
        >
          Acessar CRM <ArrowUpRight className="h-4 w-4" />
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-24 text-center md:pt-24">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs uppercase tracking-widest text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Online 24 horas — Rio de Janeiro
        </div>

        <h1 className="mx-auto mt-8 max-w-4xl font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
          Pré-atendimento <span className="text-primary text-glow">no WhatsApp</span>
          <br />sem perder cliente nenhum.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          4 agentes inteligentes por nicho. Captura de pedidos, agendamento de entregas
          e consultas, com CRM e gráficos por região — tudo em conformidade com a LGPD.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#agentes"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)]"
          >
            Escolher um agente
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
          <a
            href="#crm"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-6 py-3 font-medium text-foreground backdrop-blur transition-all hover:bg-card"
          >
            <BarChart3 className="h-4 w-4" /> Ver CRM
          </a>
        </div>

        {/* trust strip */}
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-6 text-left">
          {[
            { icon: Clock, label: "24/7", sub: "sempre online" },
            { icon: MapPin, label: "Por região", sub: "bairro & CEP" },
            { icon: ShieldCheck, label: "LGPD", sub: "consentimento" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="card-3d flex items-center gap-3 p-4">
              <Icon className="h-5 w-5" style={{ color: '#2E8B57' }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: '#FFFAF0' }}>{label}</div>
                <div className="text-xs" style={{ color: '#A9A9A9' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Agents grid */}
      <section id="agentes" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary">04 agentes</div>
            <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">Escolha seu nicho</h2>
          </div>
          <p className="hidden max-w-sm text-sm text-muted-foreground md:block">
            Cada agente foi treinado com fluxos próprios de atendimento, agendamento e logística.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {agents.map(({ name, tag, desc, icon: Icon, accent, gptId }) => (
            <button
              key={name}
              onClick={() => setActiveAgent(agents.find(a => a.gptId === gptId) || null)}
              className="group relative overflow-hidden rounded-2xl border border-border/60 p-6 text-left transition-all duration-500 hover:-translate-y-1"
              style={{ background: '#696969', boxShadow: '4px 4px 0 #444, -1px -1px 0 #888' }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: '#000', border: '2px solid #2E8B57' }}>
                <Icon className="h-6 w-6" style={{ color: '#2E8B57' }} />
              </div>

              <div className="mt-6">
                <div className="text-xs uppercase tracking-widest" style={{ color: '#A9A9A9' }}>{tag}</div>
                <h3 className="mt-1 font-display text-xl font-semibold" style={{ color: '#FFFAF0' }}>{name}</h3>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: '#FFFAF0' }}>{desc}</p>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-4">
                <span className="text-xs" style={{ color: '#A9A9A9' }}>Iniciar conversa</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: '#2E8B57', color: '#FFFAF0' }}>
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* CRM band */}
      <section id="crm" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card to-background p-10 md:p-14">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative grid items-center gap-10 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-widest text-primary">Painel administrativo</div>
              <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
                CRM com gráficos<br />por região e produto.
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Veja onde seus clientes estão, o que mais vendem, e agende entregas
                e consultas direto do dashboard.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)]"
              >
                Entrar no CRM <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Mini dashboard mock */}
            <div className="rounded-2xl border border-border/60 bg-background/60 p-5 backdrop-blur">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Atendimentos / semana</span>
                <span className="text-primary">+24%</span>
              </div>
              <div className="mt-4 flex h-32 items-end gap-2">
                {[40, 65, 50, 80, 72, 95, 88].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-primary/20 to-primary animate-beam" style={{ height: `${h}%`, animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                {[
                  { v: "Zona Sul", n: "42%" },
                  { v: "Centro", n: "31%" },
                  { v: "Barra", n: "27%" },
                ].map((r) => (
                  <div key={r.v} className="rounded-lg border border-border/60 bg-card/40 px-2 py-3">
                    <div className="text-sm font-semibold">{r.n}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security strip */}
      <section id="seguranca" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { t: "Segurança nativa", d: "HTTPS, RLS no banco, JWT e webhook tokenizado desde o dia 1." },
            { t: "Conformidade LGPD", d: "Aviso de coleta, consentimento explícito e exclusão de dados." },
            { t: "Multi-tenant", d: "Cada cliente isolado, com auditoria de acesso ao CRM." },
          ].map((b) => (
            <div key={b.t} className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold">{b.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LGPD notice */}
      <section id="lgpd" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <h3 className="font-display text-lg font-semibold text-primary">LGPD — Seus dados estão protegidos</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Os dados coletados são usados apenas para agendamento e atendimento. Não compartilhamos com terceiros.
            Você pode solicitar a exclusão dos seus dados a qualquer momento.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ao iniciar uma conversa, você concorda com o uso dos seus dados para atendimento.
          </p>
        </div>
      </section>

      {/* GPT Maker Chatbot Dialog */}
      <Dialog open={!!activeAgent} onOpenChange={(open) => !open && setActiveAgent(null)}>
        <DialogContent className="max-w-2xl w-[700px] h-[640px] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 flex w-full items-center justify-between border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm font-medium">
              {activeAgent && (
                <>
                  <activeAgent.icon className="h-4 w-4 text-primary" />
                  {activeAgent.name}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {activeAgent && (
            <iframe
              src={`https://app.gptmaker.ai/widget/${activeAgent.gptId}/iframe`}
              width="100%"
              height="100%"
              className="flex-1 min-h-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
              allow="camera; microphone; autoplay; fullscreen"
              frameBorder="0"
            />
          )}
        </DialogContent>
      </Dialog>

      <footer className="relative z-10 border-t border-border/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} AtendZap — Pré-atendimento WhatsApp para PMEs do Rio.</span>
          <span>v3.0 · Segurança & LGPD</span>
        </div>
      </footer>
    </main>
  );
}