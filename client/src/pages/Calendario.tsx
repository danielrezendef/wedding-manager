import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
  LayoutGrid,
  Rows3,
  Clock
} from "lucide-react";
import AgendamentoModal from "@/components/AgendamentoModal";
import { formatDateSafe } from "@shared/dateUtils";

export default function Calendario() {
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("dayGridMonth");

  // Buscamos todos os agendamentos (sem paginação restrita para o calendário)
  // Nota: Em um app real, filtraríamos por data de início/fim visível no calendário
  const { data, isLoading } = trpc.agendamentos.list.useQuery({
    pageSize: 1000, // Pegamos uma quantidade grande para o calendário
  });

  const events = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((ag) => ({
      id: String(ag.id),
      title: ag.descricao,
      start: `${ag.dataEvento}T${ag.horario}`,
      extendedProps: { ...ag },
      backgroundColor: getStatusColor(ag.status),
      borderColor: getStatusColor(ag.status),
    }));
  }, [data]);

  function getStatusColor(status: string) {
    switch (status) {
      case "orcamento": return "#94a3b8"; // slate-400
      case "confirmado": return "#3b82f6"; // blue-500
      case "pagamento": return "#f59e0b"; // amber-500
      case "concluido": return "#10b981"; // emerald-500
      default: return "#3b82f6";
    }
  }

  const handleEventClick = (info: any) => {
    navigate(`/agendamentos/${info.event.id}`);
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
            <span>Novo Agendamento</span>
          </Button>
        </div>
      </div>

      {/* Calendar Card */}
      <Card className="border-border/50 flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-[500px] w-full" />
            </div>
          ) : (
            <div className="calendar-container p-4 h-full">
              <style dangerouslySetInnerHTML={{ __html: `
                .fc { --fc-border-color: hsl(var(--border) / 0.5); --fc-button-bg-color: hsl(var(--primary)); --fc-button-border-color: hsl(var(--primary)); --fc-today-bg-color: hsl(var(--accent) / 0.3); }
                .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 700; text-transform: capitalize; }
                .fc .fc-button { font-weight: 500; text-transform: capitalize; padding: 0.5rem 1rem; }
                .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background-color: hsl(var(--primary)); border-color: hsl(var(--primary)); }
                .fc .fc-event { cursor: pointer; padding: 2px 4px; border-radius: 4px; font-size: 0.85rem; }
                .fc-theme-standard td, .fc-theme-standard th { border-color: hsl(var(--border) / 0.5); }
                .fc .fc-daygrid-day-number { font-size: 0.9rem; padding: 8px; }
                @media (max-width: 640px) { .fc .fc-toolbar { flex-direction: column; gap: 1rem; } }
              `}} />
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView="dayGridMonth"
                locale={ptBrLocale}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth"
                }}
                buttonText={{
                  today: "Hoje",
                  month: "Mês",
                  week: "Semana",
                  day: "Dia",
                  list: "Agenda"
                }}
                events={events}
                eventClick={handleEventClick}
                height="auto"
                aspectRatio={1.8}
                expandRows={true}
                stickyHeaderDates={true}
                dayMaxEvents={true}
                nowIndicator={true}
                editable={false}
                selectable={true}
              />
            </div>
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
