import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ChevronRight, ChevronLeft, Send, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const WEBHOOK_URL = "https://n8n.autoindpro.com.br/webhook/forneto";

interface Question {
  id: string;
  category: string;
  title: string;
  description: string;
  options: { value: string; label: string; description?: string }[];
}

const questions: Question[] = [
  {
    id: "registro_movimentacao",
    category: "Controle Operacional",
    title: "Registro de Movimentação",
    description: "Como é realizado atualmente o registro de entradas (compras) e saídas (vendas/perdas)?",
    options: [
      { value: "software", label: "Via software de gestão", description: "Sistema informatizado com registro digital" },
      { value: "manual", label: "Manual em papel", description: "Planilhas ou cadernos físicos" },
      { value: "nenhum", label: "Sem registro formal", description: "Não existe controle sistemático" },
    ],
  },
  {
    id: "rigor_recebimento",
    category: "Controle de Qualidade",
    title: "Rigor no Recebimento",
    description: "No ato da entrega, é utilizada uma balança para conferir se o peso físico das proteínas e insumos caros coincide exatamente com o faturado na nota fiscal?",
    options: [
      { value: "sempre", label: "Sim, sempre", description: "Conferência rigorosa em 100% das entregas" },
      { value: "as_vezes", label: "Às vezes", description: "Conferência parcial ou irregular" },
      { value: "nao", label: "Não fazemos", description: "Sem conferência de peso no recebimento" },
    ],
  },
  {
    id: "segregacao_estoques",
    category: "Gestão de Estoque",
    title: "Segregação de Estoques",
    description: "O estoque central (bruto/trancado) é separado fisicamente do estoque da cozinha (operacional), ou toda a mercadoria fica disponível para livre acesso da equipe?",
    options: [
      { value: "totalmente_separado", label: "Totalmente separado", description: "Estoque central trancado, com acesso controlado" },
      { value: "parcialmente", label: "Parcialmente separado", description: "Alguma divisão, mas sem controle rígido" },
      { value: "acesso_livre", label: "Acesso livre", description: "Toda mercadoria disponível para a equipe" },
    ],
  },
  {
    id: "priorizacao_8020",
    category: "Estratégia",
    title: "Priorização — Regra 80/20",
    description: "Você identifica quais são os 20% de itens que representam 80% do valor do seu estoque (Itens de Classe A) e dedica a eles um controle mais rigoroso e frequente?",
    options: [
      { value: "sim_formalmente", label: "Sim, formalmente", description: "Classificação ABC documentada e aplicada" },
      { value: "parcialmente", label: "Parcialmente", description: "Reconheço os itens, mas sem processo formal" },
      { value: "nao", label: "Não faço isso", description: "Todos os itens recebem o mesmo nível de controle" },
    ],
  },
  {
    id: "entendimento_cmv",
    category: "Indicadores Financeiros",
    title: "Entendimento do CMV",
    description: "Você sabe calcular o CMV (Custo de Mercadoria Vendida) da casa e compreende que ele é um indicador de consumo — o que foi usado/sumiu — e não apenas um indicador de compras?",
    options: [
      { value: "sim_completo", label: "Sim, completamente", description: "Calculo e interpreto corretamente o CMV" },
      { value: "parcialmente", label: "Parcialmente", description: "Conheço o conceito, mas tenho dúvidas na prática" },
      { value: "nao_sei", label: "Não sei calcular", description: "Preciso aprender a calcular e interpretar o CMV" },
    ],
  },
  {
    id: "precisao_acuracia",
    category: "Inventário",
    title: "Precisão e Acurácia",
    description: "Com que frequência é realizado o inventário físico para confrontar o que está na prateleira com o saldo teórico do sistema, visando medir a precisão do estoque?",
    options: [
      { value: "diariamente", label: "Diariamente", description: "Contagem física diária dos itens críticos" },
      { value: "semanalmente", label: "Semanalmente", description: "Inventário semanal completo ou parcial" },
      { value: "mensalmente", label: "Mensalmente", description: "Apenas no fechamento mensal" },
      { value: "raramente", label: "Raramente ou nunca", description: "Sem rotina de inventário definida" },
    ],
  },
  {
    id: "fichas_tecnicas",
    category: "Cardápio & Sistemas",
    title: "Fichas Técnicas e Baixas",
    description: "Todos os itens do cardápio (pizzas e pratos) possuem fichas técnicas cadastradas que dão baixa automática nas matérias-primas no momento exato da venda?",
    options: [
      { value: "sim_todos", label: "Sim, todos os itens", description: "100% do cardápio com fichas técnicas ativas" },
      { value: "parcialmente", label: "Parcialmente", description: "Parte do cardápio com fichas técnicas" },
      { value: "nao", label: "Não temos", description: "Sem fichas técnicas cadastradas" },
    ],
  },
  {
    id: "gestao_rendimento",
    category: "Controle de Proteínas",
    title: "Gestão de Rendimento",
    description: "Existe o processo de porcionamento das proteínas com medição do rendimento (peso bruto vs. peso limpo), comparando o resultado com uma meta de aproveitamento pré-definida?",
    options: [
      { value: "sim_com_metas", label: "Sim, com metas definidas", description: "Medimos e comparamos com metas de aproveitamento" },
      { value: "sem_metas", label: "Fazemos, mas sem metas", description: "Porcionamos, mas sem referência de rendimento" },
      { value: "nao_fazemos", label: "Não fazemos", description: "Sem processo de controle de rendimento" },
    ],
  },
  {
    id: "estrategia_compras",
    category: "Estratégia de Compras",
    title: "Estratégia de Compras",
    description: "As compras são realizadas com base em um ponto de reposição (estoque ideal) definido tecnicamente ou são feitas de maneira empirica/no 'olhometro'?",
    options: [
      { value: "ponto_reposicao", label: "Ponto de reposição técnico", description: "Compras baseadas em estoque mínimo calculado" },
      { value: "misto", label: "Método misto", description: "Combinação de critérios técnicos e empíricos" },
      { value: "olhometro", label: "Empirico / 'olhometro'", description: "Compras baseadas na percepção do momento" },
    ],
  },
  {
    id: "monitoramento_gap",
    category: "Indicadores Avançados",
    title: "Monitoramento da Lacuna (Gap)",
    description: "Você monitora a diferença entre o seu CMV Real e o seu CMV Teórico para identificar desperdícios ocultos, desvios ou falhas de processo na cozinha?",
    options: [
      { value: "sim_regularmente", label: "Sim, regularmente", description: "Análise mensal ou mais frequente do gap de CMV" },
      { value: "as_vezes", label: "Às vezes", description: "Análise esporádica sem periodicidade definida" },
      { value: "nao_monitoro", label: "Não monitoro", description: "Desconheço ou não acompanho esse indicador" },
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
    setStatus("submitting");
    setErrorMsg("");

    const payload = {
      restaurante: "Forneto",
      respondente: respondentName,
      cargo: respondentRole,
      data_submissao: new Date().toISOString(),
      respostas: questions.map((q) => ({
        pergunta_id: q.id,
        categoria: q.category,
        pergunta: q.title,
        resposta: answers[q.id] || "Não respondido",
        resposta_label:
          q.options.find((o) => o.value === answers[q.id])?.label || "Não respondido",
      })),
    };

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Erro ${res.status}`);
      setStatus("success");
      setDirection(1);
      setStep(questions.length + 1);
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Erro desconhecido ao enviar."
      );
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
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, hsl(38 80% 60%) 0%, transparent 60%), radial-gradient(circle at 80% 20%, hsl(14 70% 50%) 0%, transparent 50%)" }} />
        <div className="relative max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2"
              style={{ color: "hsl(38 90% 72%)" }}>
              Consultoria Especializada
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-1">
              Restaurante Forneto
            </h1>
            <p className="text-sm md:text-base font-light"
              style={{ color: "hsl(38 60% 82%)" }}>
              Diagnóstico de Gestão de Estoque
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
            <span className="text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>
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
                  <span className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
                    style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                    Bem-vindo ao Diagnóstico
                  </span>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                    Avaliação de Maturidade em Gestão de Estoque
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Este questionário visa <strong className="text-foreground">identificar oportunidades de melhoria na lucratividade</strong> e medir a evolução do aprendizado técnico da equipe gestora do Restaurante Forneto.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-sm mt-3">
                    São <strong className="text-foreground">10 perguntas objetivas</strong> sobre processos de compras, controle de estoque e indicadores financeiros. Responda com sinceridade para obter um diagnóstico preciso.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">
                      Seu nome <span style={{ color: "hsl(var(--primary))" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={respondentName}
                      onChange={(e) => setRespondentName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 transition-shadow"
                      style={{ "--tw-ring-color": "hsl(var(--ring))" } as React.CSSProperties}
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
                      placeholder="Ex: Gerente de Operações"
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 transition-shadow"
                      style={{ "--tw-ring-color": "hsl(var(--ring))" } as React.CSSProperties}
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
                      : "bg-muted text-muted-foreground cursor-not-allowed"
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
                  <span className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-3"
                    style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
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
                    const isSelected = answers[currentQuestion.id] === option.value;
                    return (
                      <motion.button
                        key={option.value}
                        onClick={() => selectAnswer(currentQuestion.id, option.value)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                          "w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 group",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        )}
                        style={isSelected ? { borderColor: "hsl(var(--primary))" } : {}}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200",
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40 group-hover:border-primary/60"
                          )}
                            style={isSelected ? { borderColor: "hsl(var(--primary))", background: "hsl(var(--primary))" } : {}}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                          </div>
                          <div className="flex-1">
                            <p className={cn(
                              "font-semibold text-sm",
                              isSelected ? "text-foreground" : "text-foreground"
                            )}>
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
                          : "bg-muted text-muted-foreground cursor-not-allowed"
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
                          : "bg-muted text-muted-foreground cursor-not-allowed"
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
                    <p>{errorMsg || "Falha ao enviar. Verifique sua conexão e tente novamente."}</p>
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
                  <CheckCircle className="w-10 h-10" style={{ color: "hsl(var(--primary))" }} />
                </motion.div>

                <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                  Diagnóstico Enviado!
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm mx-auto">
                  Obrigado, <strong className="text-foreground">{respondentName}</strong>! Suas respostas foram registradas com sucesso. Nossa equipe irá analisar o diagnóstico e entrar em contato em breve.
                </p>

                <div className="bg-muted/60 rounded-xl p-5 text-left mb-6">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                    style={{ color: "hsl(var(--primary))" }}>
                    Resumo do Diagnóstico
                  </p>
                  <div className="space-y-2">
                    {questions.map((q) => {
                      const answer = q.options.find((o) => o.value === answers[q.id]);
                      return (
                        <div key={q.id} className="flex items-start justify-between gap-3 text-xs">
                          <span className="text-muted-foreground flex-1">{q.title}</span>
                          <span className="font-medium text-foreground text-right">{answer?.label || "—"}</span>
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
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm gradient-accent text-white shadow-button hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
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
          © {new Date().getFullYear()} Consultoria Forneto · Diagnóstico de Gestão de Compras e Estoques
        </p>
      </footer>
    </div>
  );
}
