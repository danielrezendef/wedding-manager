import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDateSafe } from "@shared/dateUtils";
import StatusBadge from "@/components/StatusBadge";

type ViewType = "month" | "week" | "day";

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return formatDateISO(date1) === formatDateISO(date2);
}

export default function Calendario() {
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("month");

  // Buscamos todos os agendamentos
  const { data, isLoading } = trpc.agendamentos.list.useQuery({
    pageSize: 1000,
  });

  // Agrupar agendamentos por data
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, typeof data.items> = {};
    if (!data?.items) return grouped;
    
    data.items.forEach((ag) => {
      const dateKey = ag.dataEvento;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(ag);
    });
    return grouped;
  }, [data]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Renderizar calendário mensal
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const monthName = currentDate.toLocaleString("pt-BR", { month: "long", year: "numeric" });

    // Preencher dias vazios do mês anterior
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 bg-muted/30 text-muted-foreground text-sm"></div>);
    }

    // Preencher dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateStr = formatDateISO(date);
      const events = eventsByDate[dateStr] || [];
      const isToday = isSameDay(date, new Date());

      days.push(
        <div
          key={day}
          className={`p-2 border rounded-lg min-h-24 cursor-pointer transition-colors ${
            isToday ? "bg-primary/10 border-primary" : "bg-background border-border/50 hover:bg-accent/50"
          }`}
          onClick={() => setView("day")}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? "text-primary" : ""}`}>{day}</div>
          <div className="space-y-1">
            {events.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className="text-xs p-1 rounded bg-blue-100 text-blue-900 truncate cursor-pointer hover:bg-blue-200"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/agendamentos/${event.id}`);
                }}
                title={event.descricao}
              >
                {event.horario?.slice(0, 5)} - {event.descricao}
              </div>
            ))}
            {events.length > 2 && (
              <div className="text-xs text-muted-foreground px-1">+{events.length - 2} mais</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold capitalize">{monthName}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Cabeçalho com dias da semana */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-2">{days}</div>
      </div>
    );
  };

  // Renderizar visualização de semana
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));
    const weekStart = formatDateSafe(weekDays[0]);
    const weekEnd = formatDateSafe(weekDays[6]);

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Semana de {weekStart} a {weekEnd}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dateStr = formatDateISO(day);
            const events = eventsByDate[dateStr] || [];
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dateStr}
                className={`p-3 border rounded-lg min-h-40 ${
                  isToday ? "bg-primary/10 border-primary" : "bg-background border-border/50"
                }`}
              >
                <div className={`text-sm font-semibold mb-2 ${isToday ? "text-primary" : ""}`}>
                  {day.toLocaleString("pt-BR", { weekday: "short", day: "numeric" })}
                </div>
                <div className="space-y-1">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="text-xs p-2 rounded bg-blue-100 text-blue-900 cursor-pointer hover:bg-blue-200"
                      onClick={() => navigate(`/agendamentos/${event.id}`)}
                      title={event.descricao}
                    >
                      <div className="font-semibold">{event.horario?.slice(0, 5)}</div>
                      <div className="truncate">{event.descricao}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizar visualização de dia
  const renderDayView = () => {
    const dateStr = formatDateISO(currentDate);
    const events = eventsByDate[dateStr] || [];
    const dayName = currentDate.toLocaleString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold capitalize">{dayName}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, -1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 text-muted-foreground/25 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum agendamento para este dia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events
              .sort((a, b) => (a.horario || "").localeCompare(b.horario || ""))
              .map((event) => (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/agendamentos/${event.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-base">{event.descricao}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {event.horario?.slice(0, 5)} • {event.enderecoCerimonia}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Valor: R$ {Number(event.valorServico).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <StatusBadge status={event.status} />
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
    <div className="space-y-5 page-enter h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendário</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Visualize e gerencie seus compromissos de forma organizada
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Agendamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex gap-2">
        <Button
          variant={view === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("month")}
        >
          Mês
        </Button>
        <Button
          variant={view === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("week")}
        >
          Semana
        </Button>
        <Button
          variant={view === "day" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("day")}
        >
          Dia
        </Button>
      </div>

      {/* Calendar Card */}
      <Card className="border-border/50 flex-1 overflow-hidden">
        <CardContent className="p-6 h-full overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-[500px] w-full" />
            </div>
          ) : (
            <>
              {view === "month" && renderMonthView()}
              {view === "week" && renderWeekView()}
              {view === "day" && renderDayView()}
            </>
          )}
        </CardContent>
      </Card>

      {showCreate && (
        <AgendamentoModal
          open={showCreate}
          onOpenChange={setShowCreate}
        />
      )}
    </div>
  );
}
