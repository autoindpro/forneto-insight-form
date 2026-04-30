import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Send,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const WEBHOOK_URL =
  import.meta.env.VITE_WEBHOOK_URL ??
  "https://n8n.autoindpro.com.br/webhook/prestek";
const WEBHOOK_WAIT_MS = Math.max(
  0,
  Number(import.meta.env.VITE_WEBHOOK_WAIT_MS ?? 5000),
);

interface Question {
  id: string;
  category: string;
  title: string;
  description: string;
  options: { value: string; label: string; description?: string }[];
}

const questions: Question[] = [
  {
    id: "catalogo_itens",
    category: "Cadastro & Sistemas",
    title: "Cadastro de itens e serialização",
    description:
      "Como é feito o cadastro e o controle de itens como ONTs/roteadores (nº de série), cabos, conectores e materiais de instalação?",
    options: [
      {
        value: "sistema_serial",
        label: "Sistema com serial/SKU",
        description: "Cadastro por SKU e controle por número de série quando aplicável",
      },
      {
        value: "misto",
        label: "Misto",
        description: "Alguns itens controlados, outros ficam genéricos",
      },
      {
        value: "nao_padronizado",
        label: "Não padronizado",
        description: "Controle informal/planilhas, sem rastreabilidade consistente",
      },
    ],
  },
  {
    id: "recebimento",
    category: "Recebimento",
    title: "Conferência no recebimento",
    description:
      "No recebimento de compras, como é feita a conferência de quantidade, modelo e número de série (quando existir)?",
    options: [
      {
        value: "rigor_total",
        label: "Rigorosa em 100%",
        description: "Conferimos quantidade + itens críticos + seriais",
      },
      {
        value: "parcial",
        label: "Parcial",
        description: "Conferência por amostragem ou só quantidade",
      },
      {
        value: "minima",
        label: "Mínima ou inexistente",
        description: "Quase não conferimos; problemas aparecem depois",
      },
    ],
  },
  {
    id: "segregacao_estoque",
    category: "Armazenagem",
    title: "Segregação de estoques",
    description:
      "O estoque central (almoxarifado) é separado do estoque operacional (técnicos/veículos/POP), com controle de acesso e responsabilidade?",
    options: [
      {
        value: "separado_controlado",
        label: "Totalmente separado e controlado",
        description: "Retiradas por requisição/OS e responsável definido",
      },
      {
        value: "parcial",
        label: "Parcialmente",
        description: "Existe separação, mas com brechas de controle",
      },
      {
        value: "acesso_livre",
        label: "Acesso livre",
        description: "Materiais ficam disponíveis sem rastreio consistente",
      },
    ],
  },
  {
    id: "priorizacao_abc",
    category: "Estratégia",
    title: "Priorização (Curva ABC / 80-20)",
    description:
      "Vocês identificam e controlam com mais rigor os itens que mais impactam custo/risco (ex.: ONT, roteador, OLT/placas, bobinas de fibra, conectores)?",
    options: [
      {
        value: "sim_formal",
        label: "Sim, formalmente",
        description: "Curva ABC definida e rotina de controle para itens A",
      },
      {
        value: "parcial",
        label: "Parcialmente",
        description: "Sabemos os itens críticos, mas sem processo formal",
      },
      {
        value: "nao",
        label: "Não",
        description: "Todos os itens recebem o mesmo nível de atenção",
      },
    ],
  },
  {
    id: "planejamento_compras",
    category: "Compras",
    title: "Planejamento e ponto de reposição",
    description:
      "As compras de materiais/equipamentos são feitas com base em ponto de reposição e previsão de demanda (instalações, churn, upgrades) ou no \"feeling\"?",
    options: [
      {
        value: "tecnico",
        label: "Técnico (com reposição)",
        description: "Estoque mínimo/lead time e previsão por OS/demanda",
      },
      {
        value: "misto",
        label: "Misto",
        description: "Parte calculado, parte empírico",
      },
      {
        value: "empirico",
        label: "Empírico",
        description: "Compra quando falta ou quando alguém percebe",
      },
    ],
  },
  {
    id: "inventario",
    category: "Inventário",
    title: "Frequência e acuracidade",
    description:
      "Com que frequência é realizado inventário/ciclo de contagem para confrontar saldo físico x sistema e medir acuracidade do estoque?",
    options: [
      {
        value: "ciclico",
        label: "Cíclico (semanal/quinzenal)",
        description: "Itens críticos contados com alta frequência",
      },
      {
        value: "mensal",
        label: "Mensal",
        description: "Rotina mensal de inventário total ou parcial",
      },
      {
        value: "raramente",
        label: "Raramente",
        description: "Sem rotina definida de contagem e reconciliação",
      },
    ],
  },
  {
    id: "baixa_por_os",
    category: "Operação",
    title: "Baixa por OS (consumo teórico)",
    description:
      "Os materiais/equipamentos usados em instalação/manutenção têm baixa no sistema por Ordem de Serviço (kit por tipo de serviço), para formar um consumo teórico?",
    options: [
      {
        value: "sim_padronizado",
        label: "Sim, padronizado",
        description: "Kits e baixas por OS com rastreio consistente",
      },
      {
        value: "parcial",
        label: "Parcialmente",
        description: "Alguns serviços têm kit/baixa; outros ficam soltos",
      },
      {
        value: "nao",
        label: "Não",
        description: "Materiais saem do estoque sem vínculo claro com a OS",
      },
    ],
  },
  {
    id: "devolucao_comodato",
    category: "Reverso",
    title: "Devolução e comodato (CPE)",
    description:
      "Quando há cancelamento/troca de equipamento, existe processo para recolher, testar e dar entrada no estoque (ou baixar como perda)?",
    options: [
      {
        value: "processo_completo",
        label: "Sim, completo",
        description: "Coleta + triagem + entrada + rastreio por serial",
      },
      {
        value: "irregular",
        label: "Irregular",
        description: "Às vezes recolhe; entrada/triagem não é consistente",
      },
      {
        value: "nao",
        label: "Não temos",
        description: "Equipamentos se perdem ou não retornam ao estoque",
      },
    ],
  },
  {
    id: "fornecedores_leadtime",
    category: "Fornecedores",
    title: "Lead time e contratos",
    description:
      "Vocês controlam lead time por fornecedor e têm acordos/contratos para itens críticos (para evitar ruptura e compras emergenciais)?",
    options: [
      {
        value: "sim",
        label: "Sim",
        description: "Lead time monitorado e compras planejadas",
      },
      {
        value: "parcial",
        label: "Parcialmente",
        description: "Alguns fornecedores controlados, outros no improviso",
      },
      {
        value: "nao",
        label: "Não",
        description: "Dependemos de urgência e disponibilidade do momento",
      },
    ],
  },
  {
    id: "monitoramento_gap",
    category: "Indicadores",
    title: "Controle de perdas e desvios (gap)",
    description:
      "Vocês medem a diferença entre consumo teórico (por OS/kits) e consumo real/baixas para identificar perdas, desvios ou falhas de processo?",
    options: [
      {
        value: "sim_regular",
        label: "Sim, regularmente",
        description: "Acompanhamento mensal ou mais frequente",
      },
      {
        value: "as_vezes",
        label: "Às vezes",
        description: "Análise esporádica sem rotina definida",
      },
      {
        value: "nao",
        label: "Não",
        description: "Não existe indicador/rotina de análise",
      },
    ],
  },
];

type Answers = Record<string, string>;
type FormStatus = "idle" | "submitting" | "success" | "error";

export default function DiagnosticForm() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [direction, setDirection] = useState(1);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [deliveryUnconfirmed, setDeliveryUnconfirmed] = useState(false);
  const [respondentName, setRespondentName] = useState("");
  const [respondentRole, setRespondentRole] = useState("");

  const isIntro = step === 0;
  const isOutro = step === questions.length + 1;
  const questionStep = step - 1;
  const currentQuestion = questions[questionStep];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPct = (answeredCount / totalQuestions) * 100;

  const canAdvance = isIntro
    ? respondentName.trim().length > 0
    : currentQuestion && answers[currentQuestion.id] !== undefined;

  function goNext() {
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goPrev() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function selectAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMsg("");
    setDeliveryUnconfirmed(false);
    setDirection(1);
    setStep(questions.length + 1);

    const payload = {
      empresa: "Prestek",
      restaurante: "Prestek",
      respondente: respondentName,
      cargo: respondentRole,
      data_submissao: new Date().toISOString(),
      respostas: questions.map((q) => ({
        pergunta_id: q.id,
        categoria: q.category,
        pergunta: q.title,
        resposta: answers[q.id] || "Não respondido",
        resposta_label:
          q.options.find((o) => o.value === answers[q.id])?.label ||
          "Não respondido",
      })),
    };

    try {
      const body = JSON.stringify(payload);
      const timeoutSentinel = Symbol("timeout");
      const sendPromise = fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });

      const raceResult = await Promise.race([
        sendPromise,
        new Promise<typeof timeoutSentinel>((resolve) =>
          window.setTimeout(() => resolve(timeoutSentinel), WEBHOOK_WAIT_MS),
        ),
      ]);

      if (raceResult === timeoutSentinel) {
        // O webhook pode ter recebido o POST, mas o workflow pode demorar (ex.: agente de IA).
        // Evita marcar como erro só porque a resposta demorou.
        setDeliveryUnconfirmed(true);
        setStatus("success");

        void sendPromise
          .then((res) => {
            if (res.ok) setDeliveryUnconfirmed(false);
          })
          .catch(() => {
            setDeliveryUnconfirmed(true);
          });

        return;
      }

      const res = raceResult;
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      setStatus("success");
    } catch (err) {
      // Fallback para evitar preflight/CORS bloqueando o POST (comum em webhooks).
      // No modo "no-cors" não dá para validar o status da resposta.
      try {
        await fetch(WEBHOOK_URL, {
          method: "POST",
          mode: "no-cors",
          body: JSON.stringify(payload),
          keepalive: true,
        });
        setDeliveryUnconfirmed(true);
        setStatus("success");
      } catch (fallbackErr) {
        setStatus("error");
        setErrorMsg(
          fallbackErr instanceof Error
            ? fallbackErr.message
            : err instanceof Error
              ? err.message
              : "Erro desconhecido ao enviar.",
        );
      }
    }
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-hero py-8 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, hsl(38 80% 60%) 0%, transparent 60%), radial-gradient(circle at 80% 20%, hsl(14 70% 50%) 0%, transparent 50%)",
          }}
        />
        <div className="relative max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2 text-white">
              Flux Soluções - Consultoria Empresarial
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-1">
              Prestek
            </h1>
            <p className="text-sm md:text-base font-light text-white">
              Diagnóstico de Gestão de Compras e Estoques
            </p>
          </motion.div>
        </div>
      </header>

      {/* Progress Bar */}
      {!isIntro && !isOutro && (
        <div className="max-w-2xl mx-auto px-6 pt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Questão {questionStep + 1} de {totalQuestions}
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: "hsl(var(--primary))" }}
            >
              {Math.round(progressPct)}% concluído
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full gradient-progress"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          {/* INTRO STEP */}
          {isIntro && (
            <motion.div
              key="intro"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <div className="shadow-card rounded-2xl bg-card p-8 border border-border">
                <div className="mb-6">
                  <span
                    className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
                    style={{
                      background: "hsl(var(--primary) / 0.1)",
                      color: "hsl(var(--primary))",
                    }}
                  >
                    Bem-vindo ao Diagnóstico
                  </span>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                    Avaliação de Maturidade em Compras e Estoques
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Este questionário ajuda a{" "}
                    <strong className="text-foreground">
                      identificar oportunidades de melhoria e redução de perdas
                    </strong>{" "}
                    na cadeia de suprimentos e no controle de materiais/equipamentos.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-sm mt-3">
                    São{" "}
                    <strong className="text-foreground">
                      {questions.length} perguntas objetivas
                    </strong>{" "}
                    sobre compras, recebimento, inventário, rastreabilidade e indicadores. Responda
                    com sinceridade para obter um diagnóstico preciso.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">
                      Seu nome{" "}
                      <span style={{ color: "hsl(var(--primary))" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={respondentName}
                      onChange={(e) => setRespondentName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 transition-shadow"
                      style={
                        {
                          "--tw-ring-color": "hsl(var(--ring))",
                        } as React.CSSProperties
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">
                      Cargo / Função
                    </label>
                    <input
                      type="text"
                      value={respondentRole}
                      onChange={(e) => setRespondentRole(e.target.value)}
                      placeholder="Ex: Coordenador de Operações"
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 transition-shadow"
                      style={
                        {
                          "--tw-ring-color": "hsl(var(--ring))",
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>

                <button
                  onClick={goNext}
                  disabled={!canAdvance}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200",
                    canAdvance
                      ? "gradient-accent text-white shadow-button hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
                      : "bg-muted text-muted-foreground cursor-not-allowed",
                  )}
                >
                  Iniciar Diagnóstico
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* QUESTION STEPS */}
          {!isIntro && !isOutro && currentQuestion && (
            <motion.div
              key={`question-${questionStep}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <div className="shadow-card rounded-2xl bg-card p-8 border border-border">
                <div className="mb-6">
                  <span
                    className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-3"
                    style={{
                      background: "hsl(var(--primary) / 0.1)",
                      color: "hsl(var(--primary))",
                    }}
                  >
                    {currentQuestion.category}
                  </span>
                  <h2 className="font-display text-xl font-bold text-foreground mb-3">
                    {currentQuestion.title}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {currentQuestion.description}
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {currentQuestion.options.map((option) => {
                    const isSelected =
                      answers[currentQuestion.id] === option.value;
                    return (
                      <motion.button
                        key={option.value}
                        onClick={() =>
                          selectAnswer(currentQuestion.id, option.value)
                        }
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                          "w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 group",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/50",
                        )}
                        style={
                          isSelected
                            ? { borderColor: "hsl(var(--primary))" }
                            : {}
                        }
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200",
                              isSelected
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/40 group-hover:border-primary/60",
                            )}
                            style={
                              isSelected
                                ? {
                                    borderColor: "hsl(var(--primary))",
                                    background: "hsl(var(--primary))",
                                  }
                                : {}
                            }
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={cn(
                                "font-semibold text-sm",
                                isSelected
                                  ? "text-foreground"
                                  : "text-foreground",
                              )}
                            >
                              {option.label}
                            </p>
                            {option.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {option.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={goPrev}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </button>

                  {questionStep < totalQuestions - 1 ? (
                    <button
                      onClick={goNext}
                      disabled={!canAdvance}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200",
                        canAdvance
                          ? "gradient-accent text-white shadow-button hover:opacity-90"
                          : "bg-muted text-muted-foreground cursor-not-allowed",
                      )}
                    >
                      Próxima
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!canAdvance || status === "submitting"}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200",
                        canAdvance && status !== "submitting"
                          ? "gradient-accent text-white shadow-button hover:opacity-90"
                          : "bg-muted text-muted-foreground cursor-not-allowed",
                      )}
                    >
                      {status === "submitting" ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Enviar Diagnóstico
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {status === "error" && (
                  <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>
                      {errorMsg ||
                        "Falha ao enviar. Verifique sua conexão e tente novamente."}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* SUCCESS STEP */}
          {isOutro && (
            <motion.div
              key="success"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="shadow-elevated rounded-2xl bg-card p-10 border border-border text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
                  style={{ background: "hsl(var(--primary) / 0.1)" }}
                >
                  {status === "submitting" ? (
                    <span
                      className="w-10 h-10 border-4 border-border rounded-full animate-spin"
                      style={{ borderTopColor: "hsl(var(--primary))" }}
                    />
                  ) : status === "error" ? (
                    <AlertCircle
                      className="w-10 h-10"
                      style={{ color: "hsl(var(--destructive))" }}
                    />
                  ) : (
                    <CheckCircle
                      className="w-10 h-10"
                      style={{ color: "hsl(var(--primary))" }}
                    />
                  )}
                </motion.div>

                <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                  {status === "submitting"
                    ? "Enviando diagnóstico..."
                    : status === "error"
                      ? "Falha no envio"
                      : "Diagnóstico Enviado!"}
                </h2>

                {status === "success" && (
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm mx-auto">
                    Obrigado,{" "}
                    <strong className="text-foreground">
                      {respondentName}
                    </strong>
                    ! Suas respostas foram registradas com sucesso.
                  </p>
                )}

                {status === "success" && deliveryUnconfirmed && (
                  <p className="text-muted-foreground text-xs leading-relaxed mb-6 max-w-sm mx-auto">
                    Observação: o navegador não conseguiu confirmar a resposta do
                    servidor (CORS), mas o envio foi disparado para o webhook.
                  </p>
                )}

                {status === "submitting" && (
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm mx-auto">
                    Estamos enviando suas respostas. Isso pode levar alguns
                    segundos.
                  </p>
                )}

                {status === "error" && (
                  <div className="mb-6 max-w-sm mx-auto">
                    <p className="text-sm text-destructive leading-relaxed">
                      {errorMsg ||
                        "Falha ao enviar. Verifique sua conexão e tente novamente."}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <button
                        onClick={handleSubmit}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm gradient-accent text-white shadow-button hover:opacity-90 active:scale-[0.99] transition-all duration-200"
                      >
                        Tentar novamente
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-muted/60 rounded-xl p-5 text-left mb-6">
                  <p
                    className="text-xs font-semibold uppercase tracking-widest mb-3"
                    style={{ color: "hsl(var(--primary))" }}
                  >
                    Resumo do Diagnóstico
                  </p>
                  <div className="space-y-2">
                    {questions.map((q) => {
                      const answer = q.options.find(
                        (o) => o.value === answers[q.id],
                      );
                      return (
                        <div
                          key={q.id}
                          className="flex items-start justify-between gap-3 text-xs"
                        >
                          <span className="text-muted-foreground flex-1">
                            {q.title}
                          </span>
                          <span className="font-medium text-foreground text-right">
                            {answer?.label || "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStep(0);
                    setAnswers({});
                    setStatus("idle");
                    setRespondentName("");
                    setRespondentRole("");
                  }}
                  disabled={status === "submitting"}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
                    status === "submitting"
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "gradient-accent text-white shadow-button hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]",
                  )}
                >
                  Preencher novamente
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="text-center pb-10 px-6">
        <p className="text-xs text-muted-foreground">
          © 2026 Flux Soluções · Diagnóstico de Gestão de Compras e Estoques
        </p>
      </footer>
    </div>
  );
}
