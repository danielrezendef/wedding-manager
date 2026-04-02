import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react";
import AgendamentoModal from "@/components/AgendamentoModal";
import { formatDateSafe, toISODateString } from "@shared/dateUtils";
import StatusBadge from "@/components/StatusBadge";

type ViewType = "month" | "week" | "day";

// Funções utilitárias otimizadas
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

export default function Calendario() {
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  });
  const [view, setView] = useState<ViewType>("month");

  // Busca otimizada: pegamos apenas o necessário para o calendário
  const { data, isLoading } = trpc.agendamentos.list.useQuery({
    pageSize: 1000,
  }, {
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  // Agrupamento de eventos memorizado e seguro com dateUtils
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    if (!data?.items) return grouped;
    
    data.items.forEach((ag) => {
      // Usamos toISODateString para garantir que a chave da data seja consistente (YYYY-MM-DD)
      const dateKey = toISODateString(ag.dataEvento);
      if (dateKey) {
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(ag);
      }
    });
    return grouped;
  }, [data]);

  const handlePrev = useCallback(() => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (view === "month") d.setMonth(d.getMonth() - 1);
      else if (view === "week") d.setDate(d.getDate() - 7);
      else d.setDate(d.getDate() - 1);
      return d;
    });
  }, [view]);

  const handleNext = useCallback(() => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (view === "month") d.setMonth(d.getMonth() + 1);
      else if (view === "week") d.setDate(d.getDate() + 7);
      else d.setDate(d.getDate() + 1);
      return d;
    });
  }, [view]);

  const handleToday = useCallback(() => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
  }, []);

  // Renderização do Mês
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const todayStr = toISODateString(new Date());
    
    const days = [];
    // Dias do mês anterior
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`prev-${i}`} className="h-24 sm:h-32 bg-muted/10 border border-border/30"></div>);
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day, 12, 0, 0);
      const dateStr = toISODateString(date);
      const events = eventsByDate[dateStr] || [];
      const isToday = dateStr === todayStr;

      days.push(
        <div
          key={dateStr}
          className={`h-24 sm:h-32 p-1 sm:p-2 border border-border/50 transition-colors hover:bg-accent/50 cursor-pointer flex flex-col ${
            isToday ? "bg-primary/5 ring-1 ring-inset ring-primary/30" : "bg-background"
          }`}
          onClick={() => {
            setCurrentDate(date);
            setView("day");
          }}
        >
          <span className={`text-xs sm:text-sm font-medium ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
            {day}
          </span>
          <div className="flex-1 overflow-y-auto mt-1 space-y-1 scrollbar-hide">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20 truncate font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/agendamentos/${ev.id}`);
                }}
              >
                {ev.horario?.slice(0, 5)} {ev.descricao}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="animate-in fade-in duration-300">
        <div className="grid grid-cols-7 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
            <div key={d} className="bg-muted/30 py-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  // Renderização da Semana
  const renderWeekView = () => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    const todayStr = toISODateString(new Date());

    return (
      <div className="grid grid-cols-7 gap-3 animate-in slide-in-from-right-4 duration-300">
        {Array.from({ length: 7 }).map((_, i) => {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          const dateStr = toISODateString(date);
          const events = eventsByDate[dateStr] || [];
          const isToday = dateStr === todayStr;

          return (
            <div key={dateStr} className="space-y-3">
              <div className={`text-center p-2 rounded-md ${isToday ? "bg-primary text-primary-foreground" : "bg-muted/50"}`}>
                <div className="text-[10px] uppercase font-bold opacity-80">{formatDateSafe(date, "EEE")}</div>
                <div className="text-lg font-bold">{date.getDate()}</div>
              </div>
              <div className="space-y-2">
                {events.map(ev => (
                  <div
                    key={ev.id}
                    className="p-2 rounded-lg border border-border/50 bg-card hover:border-primary/50 transition-colors cursor-pointer shadow-sm"
                    onClick={() => navigate(`/agendamentos/${ev.id}`)}
                  >
                    <div className="text-[10px] font-bold text-primary mb-1">{ev.horario?.slice(0, 5)}</div>
                    <div className="text-xs font-medium line-clamp-2">{ev.descricao}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderização do Dia
  const renderDayView = () => {
    const dateStr = toISODateString(currentDate);
    const events = (eventsByDate[dateStr] || []).sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));

    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-in zoom-in-95 duration-300">
        <div className="text-center mb-6">
          <div className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
            {formatDateSafe(currentDate, "EEEE")}
          </div>
          <div className="text-3xl font-bold">{formatDateSafe(currentDate, "dd 'de' MMMM")}</div>
        </div>

        {events.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed rounded-2xl border-border/50">
            <CalendarIcon className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum compromisso agendado</p>
            <Button variant="link" onClick={() => setShowCreate(true)} className="mt-2">
              Criar novo agendamento
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(ev => (
              <Card key={ev.id} className="group hover:border-primary/50 transition-all cursor-pointer overflow-hidden" onClick={() => navigate(`/agendamentos/${ev.id}`)}>
                <div className="flex">
                  <div className="w-2 bg-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-4 flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold text-primary tabular-nums">{ev.horario?.slice(0, 5)}</div>
                      <div>
                        <div className="font-bold text-foreground">{ev.descricao}</div>
                        <div className="text-xs text-muted-foreground">{ev.enderecoCerimonia}</div>
                      </div>
                    </div>
                    <StatusBadge status={ev.status} />
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 page-enter max-w-[1600px] mx-auto">
      {/* Header Otimizado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">Calendário</h1>
          <p className="text-muted-foreground font-medium">
            {view === "month" && currentDate.toLocaleString("pt-BR", { month: "long", year: "numeric" }).toUpperCase()}
            {view !== "month" && "GESTÃO DE COMPROMISSOS"}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
            {(["month", "week", "day"] as const).map((v) => (
              <Button
                key={v}
                variant={view === v ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-4 text-xs font-bold uppercase tracking-wider"
                onClick={() => setView(v)}
              >
                {v === "month" ? "Mês" : v === "week" ? "Semana" : "Dia"}
              </Button>
            ))}
          </div>
          <Button onClick={() => setShowCreate(true)} className="h-10 gap-2 font-bold shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Novo</span>
          </Button>
        </div>
      </div>

      {/* Toolbar de Navegação */}
      <div className="flex items-center justify-between bg-card p-2 rounded-xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handlePrev} className="h-9 w-9">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleToday} className="h-9 px-4 font-bold text-xs uppercase">
            Hoje
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNext} className="h-9 w-9">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <div className="hidden sm:block text-sm font-bold text-muted-foreground px-4">
          {formatDateSafe(currentDate, "MMMM yyyy").toUpperCase()}
        </div>
      </div>

      {/* Área do Calendário */}
      <div className="min-h-[600px]">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-[600px] w-full rounded-2xl" />
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-4 sm:p-6">
            {view === "month" && renderMonthView()}
            {view === "week" && renderWeekView()}
            {view === "day" && renderDayView()}
          </div>
        )}
      </div>

      {showCreate && <AgendamentoModal open={showCreate} onOpenChange={setShowCreate} />}
    </div>
  );
}
