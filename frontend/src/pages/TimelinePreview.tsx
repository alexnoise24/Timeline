// Preview-only page — mock data, no auth required. Remove before final deploy.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Calendar, MapPin, Users, Camera,
  Edit2, Trash2, MessageSquare, History, CheckCircle2,
  Circle, ChevronRight, Clipboard, Sparkles, FileDown,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';

type TabType = 'overview' | 'timeline' | 'shotlist' | 'inspiration';

const MOCK_TIMELINE = {
  title: 'Sarah + David',
  couple: { partner1: 'Sarah', partner2: 'David' },
  weddingDate: '2026-06-14T12:00:00Z',
  location: 'Hacienda San Ángel, Puerto Vallarta',
  collaborators: [{ name: 'Marco López' }, { name: 'Ana García' }],
  days: [
    {
      _id: 'd1',
      date: '2026-06-13T00:00:00Z',
      label: 'Pre-Wedding',
      events: [
        {
          _id: 'e1',
          title: 'Llegada y registro del equipo',
          time: '10:00',
          location: 'Lobby principal',
          category: 'preparation',
          description: 'Check-in de todos los fotógrafos y coordinadores.',
          isCompleted: true,
          notes: [],
          changeLogs: [],
        },
        {
          _id: 'e2',
          title: 'Sesión de prueba de luz',
          time: '14:30',
          location: 'Jardín norte',
          category: 'photography',
          description: 'Revisar ángulos y equipo de iluminación para el día siguiente.',
          isCompleted: false,
          notes: [
            {
              _id: 'n1',
              content: 'Llevar difusores extra por si hay sol directo',
              author: { name: 'Marco López' },
              createdAt: '2026-06-10T09:00:00Z',
            },
          ],
          changeLogs: [
            {
              _id: 'cl1',
              user: { name: 'Ana García' },
              description: 'Hora cambiada de 15:00 a 14:30',
              action: 'update',
              timestamp: '2026-06-08T11:20:00Z',
            },
          ],
        },
        {
          _id: 'e3',
          title: 'Ensayo de ceremonia',
          time: '17:00',
          location: 'Capilla San Ángel',
          category: 'ceremony',
          description: '',
          isCompleted: false,
          notes: [],
          changeLogs: [],
        },
      ],
    },
    {
      _id: 'd2',
      date: '2026-06-14T00:00:00Z',
      label: 'Día de Boda',
      events: [
        {
          _id: 'e4',
          title: 'Preparación de la novia',
          time: '08:00',
          location: 'Suite Presidencial',
          category: 'preparation',
          description: 'Hair & makeup + primeras fotos íntimas.',
          isCompleted: false,
          notes: [],
          changeLogs: [],
        },
        {
          _id: 'e5',
          title: 'Preparación del novio',
          time: '09:30',
          location: 'Villa del Jardín',
          category: 'preparation',
          description: '',
          isCompleted: false,
          notes: [],
          changeLogs: [],
        },
        {
          _id: 'e6',
          title: 'Ceremonia civil',
          time: '12:00',
          location: 'Capilla San Ángel',
          category: 'ceremony',
          description: 'Ceremonia de 45 minutos. Confirmar orden de entrada.',
          isCompleted: false,
          notes: [],
          changeLogs: [],
        },
        {
          _id: 'e7',
          title: 'Sesión de pareja en playa',
          time: '14:00',
          location: 'Playa privada',
          category: 'photography',
          description: 'Golden hour anticipado. 30 min máximo.',
          isCompleted: false,
          notes: [],
          changeLogs: [],
        },
        {
          _id: 'e8',
          title: 'Coctelería y recepción',
          time: '16:00',
          location: 'Terraza principal',
          category: 'reception',
          description: '',
          isCompleted: false,
          notes: [],
          changeLogs: [],
        },
        {
          _id: 'e9',
          title: 'Primer baile y cena',
          time: '19:30',
          location: 'Salón Gran Ángel',
          category: 'reception',
          description: 'Corte de pastel a las 21:00.',
          isCompleted: false,
          notes: [],
          changeLogs: [],
        },
      ],
    },
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  ceremony: 'CEREMONIA',
  reception: 'RECEPCIÓN',
  preparation: 'PREPARACIÓN',
  photography: 'FOTOGRAFÍA',
  other: 'OTRO',
};

export default function TimelinePreview() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set(['d1']));
  const [completedEvents, setCompletedEvents] = useState<Set<string>>(new Set(['e1']));

  const toggleCollapse = (dayId: string) => {
    setCollapsedDays(prev => {
      const s = new Set(prev);
      s.has(dayId) ? s.delete(dayId) : s.add(dayId);
      return s;
    });
  };

  const toggleComplete = (eventId: string) => {
    setCompletedEvents(prev => {
      const s = new Set(prev);
      s.has(eventId) ? s.delete(eventId) : s.add(eventId);
      return s;
    });
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'RESUMEN', icon: <Clipboard size={13} strokeWidth={1.5} /> },
    { key: 'timeline', label: 'TIMELINE', icon: <Calendar size={13} strokeWidth={1.5} /> },
    { key: 'shotlist', label: 'SHOT LIST', icon: <Camera size={13} strokeWidth={1.5} /> },
    { key: 'inspiration', label: 'INSPIRACIÓN', icon: <Sparkles size={13} strokeWidth={1.5} /> },
  ];

  return (
    <div className="flex h-screen bg-paper">

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] bg-paper border-r-[1.5px] border-ink flex-shrink-0">
        <div className="px-5 py-4 border-b-[1.5px] border-ink">
          <Logo size="sm" variant="paper" />
        </div>
        <nav className="flex-1 pt-2 flex flex-col">
          {['PROYECTOS', 'MENSAJES', 'COMUNIDAD'].map((label, i) => (
            <div
              key={label}
              className={`flex items-center gap-3 px-4 py-3 alto-label border-b border-ink/10 cursor-default ${
                i === 0 ? 'text-ink hover:bg-fog' : 'text-stone hover:bg-fog'
              }`}
            >
              {label}
            </div>
          ))}
        </nav>
        <div className="border-t-[1.5px] border-ink">
          <div className="flex items-center gap-3 px-4 py-3 alto-label text-stone hover:bg-fog cursor-default border-b border-ink/10">
            CONFIGURACIÓN
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Navbar */}
        <header className="h-16 bg-paper border-b-[1.5px] border-ink flex items-center justify-between px-6 flex-shrink-0">
          <Logo size="sm" variant="paper" />
          <div className="flex items-center gap-4">
            <span className="alto-label text-stone hidden md:inline">ES / EN</span>
            <span className="alto-label hidden md:inline text-ink">Alex Obregon</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

            {/* Preview banner */}
            <div className="mb-4 border-[1.5px] border-lavender bg-lavender/10 px-5 py-3 flex items-center justify-between">
              <span className="alto-label text-ink">MODO PREVIEW · DATOS DE EJEMPLO</span>
              <button
                onClick={() => navigate('/login')}
                className="alto-label text-lavender hover:text-lavender-deep transition-colors duration-[80ms]"
              >
                IR AL LOGIN →
              </button>
            </div>

            {/* Timeline header card */}
            <div className="border-[1.5px] border-ink bg-paper mb-4 sm:mb-6">

              {/* Back + title */}
              <div className="px-4 sm:px-6 pt-4 pb-5 border-b-[1px] border-ink/15">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/preview')}
                  className="inline-flex items-center gap-2 mb-4"
                >
                  <ArrowLeft size={14} strokeWidth={1.5} />
                  Volver
                </Button>

                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                  <div>
                    <p className="alto-label text-stone mb-1">LENZU · TIMELINE</p>
                    <h1 className="font-display font-bold text-[26px] sm:text-[34px] tracking-[-0.03em] leading-none text-ink">
                      {MOCK_TIMELINE.couple.partner1.toUpperCase()} &amp; {MOCK_TIMELINE.couple.partner2.toUpperCase()}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                      <div className="flex items-center gap-1.5 alto-label text-stone">
                        <Calendar size={13} strokeWidth={1.5} />
                        14 de junio de 2026
                      </div>
                      <div className="flex items-center gap-1.5 alto-label text-stone">
                        <MapPin size={13} strokeWidth={1.5} />
                        {MOCK_TIMELINE.location}
                      </div>
                      <div className="flex items-center gap-1.5 alto-label text-stone">
                        <Users size={13} strokeWidth={1.5} />
                        3 colaboradores
                      </div>
                      <button className="sm:ml-auto flex items-center gap-2 px-4 py-[10px] border-[1.5px] border-ink text-ink font-mono font-bold text-[11px] uppercase tracking-[0.08em] hover:bg-fog transition-colors duration-[80ms]">
                        <Camera size={14} strokeWidth={1.5} />
                        Iniciar día de boda
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center overflow-x-auto scrollbar-none">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-5 py-3 whitespace-nowrap border-r-[1px] border-ink/10 transition-colors duration-[80ms] alto-label ${
                      activeTab === tab.key
                        ? 'bg-ink text-paper'
                        : 'bg-transparent text-stone hover:text-ink hover:bg-fog'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab: placeholder panels */}
            {activeTab !== 'timeline' && (
              <div className="border-[1.5px] border-ink bg-fog py-16 text-center">
                <p className="alto-label text-stone">SECCIÓN {tabs.find(t => t.key === activeTab)?.label} — PRÓXIMAMENTE</p>
              </div>
            )}

            {/* Tab: Timeline */}
            {activeTab === 'timeline' && (
              <div className="space-y-4 sm:space-y-5">

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" className="flex items-center gap-2">
                    <FileDown size={14} strokeWidth={1.5} />
                    Exportar PDF
                  </Button>
                  <Button variant="accent" className="flex items-center gap-2" arrow>
                    <Plus size={14} strokeWidth={2} />
                    Agregar día
                  </Button>
                </div>

                {MOCK_TIMELINE.days.map(day => {
                  const isCollapsed = collapsedDays.has(day._id);
                  return (
                    <div key={day._id} className="border-[1.5px] border-ink bg-fog overflow-hidden">

                      {/* Day header */}
                      <div
                        className="flex items-center justify-between px-4 py-3 border-b-[1px] border-ink/20 cursor-pointer hover:bg-paper transition-colors duration-[80ms]"
                        onClick={() => toggleCollapse(day._id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ChevronRight
                            size={16}
                            strokeWidth={2}
                            className={`text-stone flex-shrink-0 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
                          />
                          <div>
                            <h3 className="font-display font-bold text-[15px] tracking-[-0.02em] text-ink">
                              {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
                            </h3>
                            {day.label && <p className="alto-label text-stone mt-0.5">{day.label.toUpperCase()}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <span className="border-[1px] border-ink/30 px-2 py-0.5 font-mono text-[10px] text-stone">
                            {day.events.length}
                          </span>
                          <button className="p-1.5 text-stone hover:text-ink hover:bg-fog transition-colors">
                            <Edit2 size={13} strokeWidth={1.5} />
                          </button>
                          <button className="p-1.5 text-stone hover:text-brick transition-colors">
                            <Trash2 size={13} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>

                      {/* Events */}
                      {!isCollapsed && (
                        <div className="p-4 space-y-3">

                          {/* Add event */}
                          <button className="w-full flex items-center justify-center gap-2 border-[1.5px] border-dashed border-ink/30 py-3 alto-label text-stone hover:text-ink hover:border-ink transition-colors duration-[80ms]">
                            <Plus size={13} strokeWidth={2} />
                            Agregar evento
                          </button>

                          {day.events.map(event => {
                            const isDone = completedEvents.has(event._id);
                            return (
                              <div
                                key={event._id}
                                className={`group relative border-[1px] bg-paper p-4 sm:p-5 transition-colors duration-[80ms] ${
                                  isDone ? 'opacity-60 border-ink/10' : 'border-ink/15 hover:border-ink/30'
                                }`}
                              >
                                <div className="flex gap-4">

                                  {/* Time */}
                                  <div className="flex-shrink-0 w-14 flex flex-col items-center">
                                    {event.time ? (
                                      <div className="font-mono font-bold text-[20px] leading-none text-ink">
                                        {event.time}
                                      </div>
                                    ) : (
                                      <div className="font-mono font-bold text-[18px] text-stone">--:--</div>
                                    )}
                                  </div>

                                  {/* Checkbox */}
                                  <button
                                    onClick={() => toggleComplete(event._id)}
                                    className={`flex-shrink-0 w-7 h-7 flex items-center justify-center border-[1.5px] transition-colors duration-[80ms] ${
                                      isDone
                                        ? 'bg-ink border-ink text-paper'
                                        : 'border-ink/40 bg-transparent hover:border-ink'
                                    }`}
                                  >
                                    {isDone
                                      ? <CheckCircle2 size={14} strokeWidth={2} />
                                      : <Circle size={14} strokeWidth={1.5} className="text-stone" />}
                                  </button>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h4 className={`font-mono font-bold text-[13px] text-ink break-words ${isDone ? 'line-through text-stone' : ''}`}>
                                          {event.title}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                          <span className="border-[1px] border-ink/20 px-2 py-0.5 font-mono text-[10px] text-stone uppercase">
                                            {CATEGORY_LABELS[event.category] || event.category.toUpperCase()}
                                          </span>
                                          {isDone && (
                                            <span className="border-[1px] border-moss/40 bg-moss/10 px-2 py-0.5 font-mono text-[10px] text-moss uppercase">
                                              COMPLETADO
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Action buttons (visible on hover) */}
                                      <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[80ms]">
                                        <button className="p-1.5 text-stone hover:text-ink hover:bg-fog transition-colors">
                                          <Edit2 size={13} strokeWidth={1.5} />
                                        </button>
                                        <button className="p-1.5 text-stone hover:text-brick hover:bg-brick/5 transition-colors">
                                          <Trash2 size={13} strokeWidth={1.5} />
                                        </button>
                                        <button className="p-1.5 text-stone hover:text-ink hover:bg-fog transition-colors">
                                          <MessageSquare size={13} strokeWidth={1.5} />
                                        </button>
                                      </div>
                                    </div>

                                    {event.description && (
                                      <p className="font-mono text-[11px] text-stone mt-2 leading-relaxed">{event.description}</p>
                                    )}

                                    {event.location && (
                                      <div className="flex items-center gap-1.5 mt-2 alto-label text-stone">
                                        <MapPin size={12} strokeWidth={1.5} />
                                        {event.location}
                                      </div>
                                    )}

                                    {/* Notes */}
                                    {event.notes.length > 0 && (
                                      <div className="mt-3 space-y-2">
                                        <p className="alto-label text-stone flex items-center gap-1">
                                          <MessageSquare size={11} strokeWidth={1.5} />
                                          {event.notes.length} NOTA{event.notes.length > 1 ? 'S' : ''}
                                        </p>
                                        {event.notes.map(note => (
                                          <div key={note._id} className="border-[1px] border-ink/15 bg-fog p-2">
                                            <div className="flex items-start gap-2">
                                              <div className="w-6 h-6 bg-ink text-paper flex items-center justify-center font-mono font-bold text-[9px] flex-shrink-0">
                                                {note.author.name.slice(0, 2).toUpperCase()}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                  <span className="font-mono font-bold text-[11px] text-ink">{note.author.name}</span>
                                                  <span className="alto-label text-stone shrink-0">10 jun 2026</span>
                                                </div>
                                                <p className="font-mono text-[11px] text-stone mt-0.5 leading-relaxed">{note.content}</p>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Change logs */}
                                    {event.changeLogs.length > 0 && (
                                      <details className="mt-3">
                                        <summary className="alto-label text-stone cursor-pointer flex items-center gap-1">
                                          <History size={11} strokeWidth={1.5} />
                                          {event.changeLogs.length} CAMBIO{event.changeLogs.length > 1 ? 'S' : ''}
                                        </summary>
                                        <div className="mt-1 space-y-1 border-l-[1px] border-ink/15 pl-3 ml-1">
                                          {event.changeLogs.map(log => (
                                            <div key={log._id} className="font-mono text-[10px] text-stone flex items-center gap-1 flex-wrap">
                                              <span className="font-bold">{log.user.name}</span>
                                              <span>·</span>
                                              <span>{log.description}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
