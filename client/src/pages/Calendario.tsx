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
  Clock,
  MapPin,
} from "lucide-react";
import AgendamentoModal from "@/components/AgendamentoModal";
import { formatDateSafe, toISODateString } from "@shared/dateUtils";
import StatusBadge from "@/components/StatusBadge";

type ViewType = "month" | "week" | "day";

export default function Calendario() {
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<ViewType>("month");
  const utils = trpc.useUtils();
  
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  });

  // Cálculo do intervalo de datas visível para filtrar no servidor
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (view === "month") {
      const start = new Date(year, month, 1, 12, 0, 0);
      const end = new Date(year, month + 1, 0, 12, 0, 0);
      return { start: toISODateString(start), end: toISODateString(end) };
    } else if (view === "week") {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start: toISODateString(start), end: toISODateString(end) };
    } else {
      const dayStr = toISODateString(currentDate);
      return { start: dayStr, end: dayStr };
    }
  }, [currentDate, view]);

  // Busca agendamentos filtrados pelo período visível
  const { data, isLoading, refetch } = trpc.agendamentos.list.useQuery({
    dataInicio: dateRange.start,
    dataFim: dateRange.end,
    pageSize: 50, 
  }, {
    staleTime: 1000 * 60 * 2,
  });

  // Agrupamento de eventos por data (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    if (!data?.items) return grouped;
    
    data.items.forEach((ag) => {
      let dateKey = "";
      if (typeof ag.dataEvento === 'string') {
        dateKey = ag.dataEvento.split('T')[0];
      } else if (ag.dataEvento instanceof Date) {
        dateKey = toISODateString(ag.dataEvento);
      }

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

  // --- RENDERIZAÇÃO MÊS ---
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIdx = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = toISODateString(new Date());
    const cells = [];

    for (let i = 0; i < firstDayIdx; i++) {
      cells.push(<div key={`p-${i}`} className="h-24 bg-muted/30 border border-border/50" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d, 12, 0, 0);
      const dateStr = toISODateString(date);
      const events = eventsByDate[dateStr] || [];
      const isToday = dateStr === todayStr;

      cells.push(
        <div
          key={dateStr}
          className={`h-24 p-2 border border-border/50 transition-colors hover:bg-accent/50 cursor-pointer flex flex-col overflow-hidden ${
            isToday ? "bg-primary/5 ring-1 ring-inset ring-primary/30" : "bg-background"
          }`}
          onClick={() => {
            setCurrentDate(date);
            setView("day");
          }}
        >
          <span className={`text-xs font-semibold ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
            {d}
          </span>
          <div className="flex-1 space-y-1 overflow-y-auto scrollbar-hide mt-1">
            {events.map(ev => (
              <div
                key={ev.id}
                className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 truncate font-medium"
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
      <div className="grid grid-cols-7 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
          <div key={day} className="bg-muted/50 py-2 text-center text-xs font-semibold text-muted-foreground uppercase">
            {day}
          </div>
        ))}
        {cells}
      </div>
    );
  };

  // --- RENDERIZAÇÃO SEMANA ---
  const renderWeekView = () => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    const todayStr = toISODateString(new Date());

    return (
      <div className="grid grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          const dateStr = toISODateString(date);
          const events = eventsByDate[dateStr] || [];
          const isToday = dateStr === todayStr;

          return (
            <div key={dateStr} className="space-y-2">
              <div className={`text-center p-3 rounded-lg border transition-colors ${
                isToday ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 border-border/50"
              }`}>
                <div className="text-[11px] font-semibold uppercase text-muted-foreground/80">{formatDateSafe(date, "EEE")}</div>
                <div className="text-lg font-bold">{date.getDate()}</div>
              </div>
              <div className="space-y-2">
                {events.map(ev => (
                  <div
                    key={ev.id}
                    className="p-2 rounded-lg border border-border/50 bg-card hover:border-primary/50 transition-colors cursor-pointer text-sm"
                    onClick={() => navigate(`/agendamentos/${ev.id}`)}
                  >
                    <div className="text-[10px] font-semibold text-primary mb-1">{ev.horario?.slice(0, 5)}</div>
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

  // --- RENDERIZAÇÃO DIA ---
  const renderDayView = () => {
    const dateStr = toISODateString(currentDate);
    const events = (eventsByDate[dateStr] || []).sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <div className="text-sm font-semibold text-muted-foreground uppercase mb-1">
            {formatDateSafe(currentDate, "EEEE")}
          </div>
          <div className="text-2xl font-bold">{formatDateSafe(currentDate, "dd 'de' MMMM")}</div>
        </div>

        {events.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed rounded-lg border-border/50">
            <p className="text-muted-foreground font-medium">Nenhum compromisso para este dia</p>
            <Button variant="link" onClick={() => setShowCreate(true)} className="mt-2">
              Criar novo agendamento
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(ev => (
              <Card key={ev.id} className="hover:border-primary/50 transition-colors cursor-pointer overflow-hidden" onClick={() => navigate(`/agendamentos/${ev.id}`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-lg font-bold text-primary tabular-nums">{ev.horario?.slice(0, 5)}</div>
                    <div className="flex-1">
                      <div className="font-semibold">{ev.descricao}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {ev.enderecoCerimonia}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-right">
                      R$ {Number(ev.valorServico).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <StatusBadge status={ev.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendário</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data?.total ?? 0} {(data?.total ?? 0) === 1 ? "agendamento" : "agendamentos"} no período
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Agendamento</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Toolbar de Navegação */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrev} className="h-9 w-9">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday} className="h-9 px-4 text-xs font-semibold uppercase">
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext} className="h-9 w-9">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
              {(["month", "week", "day"] as const).map((v) => (
                <Button
                  key={v}
                  variant={view === v ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-4 text-xs font-semibold uppercase"
                  onClick={() => setView(v)}
                >
                  {v === "month" ? "Mês" : v === "week" ? "Semana" : "Dia"}
                </Button>
              ))}
            </div>

            <div className="text-sm font-semibold text-muted-foreground text-right min-w-max">
              {formatDateSafe(currentDate, "MMMM yyyy").toUpperCase()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Área Principal */}
      <Card className="border-border/50">
        {isLoading ? (
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </CardContent>
        ) : (
          <CardContent className="p-6">
            {view === "month" && renderMonthView()}
            {view === "week" && renderWeekView()}
            {view === "day" && renderDayView()}
          </CardContent>
        )}
      </Card>

      {showCreate && (
        <AgendamentoModal 
          open={showCreate} 
          onClose={() => setShowCreate(false)} 
          onSuccess={() => {
            utils.agendamentos.list.invalidate();
            refetch();
          }} 
        />
      )}
    </div>
  );
}
