// Preview-only page — mock data, no auth required. Remove before final deploy.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus, Share2, Bell, Trash2, Search, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Tag from '@/components/ui/Tag';
import Ticket from '@/components/ui/Ticket';
import Avatar from '@/components/ui/Avatar';
import Logo from '@/components/ui/Logo';

const MOCK_PROJECTS = [
  {
    _id: '1',
    title: 'Sarah + David',
    description: 'Boda en Hacienda San Ángel, Puerto Vallarta',
    weddingDate: '2026-06-14T12:00:00Z',
    collaborators: [
      { name: 'Marco López' },
      { name: 'Ana García' },
      { name: 'Renata Vidal' },
    ],
  },
  {
    _id: '2',
    title: 'Caitlin + Christopher',
    description: 'Destino Tulum, Quintana Roo',
    weddingDate: '2026-08-22T12:00:00Z',
    collaborators: [
      { name: 'Sofía Ruiz' },
      { name: 'Diego Mora' },
    ],
  },
  {
    _id: '3',
    title: 'Isabella + James',
    description: 'Casa de campo, Valle de Bravo',
    weddingDate: '2026-09-05T12:00:00Z',
    collaborators: [],
  },
];

const MOCK_SHARED = [
  {
    _id: '4',
    title: 'Valentina + Roberto',
    description: 'Boda en CDMX',
    weddingDate: '2026-07-19T12:00:00Z',
    owner: { name: 'Marco López' },
  },
];

const formatDate = (d: string) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`;
};

const daysUntil = (d: string) => {
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'PASADO';
  if (days === 0) return 'HOY';
  return `${days} DÍAS`;
};

const ticketContent = (d: string) => {
  const dt = new Date(d);
  return `${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')}`;
};

export default function DashboardPreview() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const filtered = MOCK_PROJECTS.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-paper">

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-[240px] bg-paper border-r-[1.5px] border-ink flex-shrink-0">
        <div className="px-5 py-4 border-b-[1.5px] border-ink">
          <Logo size="sm" variant="paper" />
        </div>
        <nav className="flex-1 pt-2 flex flex-col">
          {[
            { label: 'PROYECTOS', active: true },
            { label: 'MENSAJES', active: false },
            { label: 'COMUNIDAD', active: false },
          ].map(item => (
            <div
              key={item.label}
              className={`flex items-center gap-3 px-4 py-3 alto-label border-b border-ink/10 cursor-default ${
                item.active ? 'bg-ink text-paper' : 'text-ink hover:bg-fog'
              }`}
            >
              {item.label}
            </div>
          ))}
        </nav>
        <div className="border-t-[1.5px] border-ink">
          <div className="flex items-center gap-3 px-4 py-3 alto-label text-ink hover:bg-fog cursor-default border-b border-ink/10">
            CONFIGURACIÓN
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Navbar */}
        <header className="h-16 bg-paper border-b-[1.5px] border-ink flex items-center justify-between px-6 flex-shrink-0">
          <Logo size="sm" variant="paper" />
          <div className="flex items-center gap-4">
            <span className="alto-label text-stone hidden md:inline">ES / EN</span>
            <div className="flex items-center gap-2">
              <Avatar initials="AO" size={32} />
              <span className="alto-label hidden md:inline">Alex Obregon</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Preview banner */}
            <div className="mb-6 border-[1.5px] border-lavender bg-lavender/10 px-5 py-3 flex items-center justify-between">
              <span className="alto-label text-ink">MODO PREVIEW · DATOS DE EJEMPLO</span>
              <button
                onClick={() => navigate('/login')}
                className="alto-label text-lavender hover:text-lavender-deep transition-colors duration-snap"
              >
                IR AL LOGIN →
              </button>
            </div>

            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 pb-6 border-b-[1.5px] border-ink">
              <div>
                <p className="alto-label text-stone mb-2">LENZU · DASHBOARD</p>
                <h1 className="font-display text-[36px] sm:text-[48px] font-bold tracking-[-0.04em] leading-none text-ink">
                  MIS PROYECTOS
                </h1>
              </div>
              <div className="flex gap-2">
                <Button variant="accent" arrow>
                  <Plus size={14} strokeWidth={2} />
                  Nuevo proyecto
                </Button>
              </div>
            </div>

            {/* My Projects */}
            <div className="mb-12">
              {/* Search */}
              <div className="relative mb-6">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Buscar proyectos..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-[12px] border-[1.5px] border-ink bg-fog font-mono text-[12px] text-ink placeholder:text-stone placeholder:font-normal focus:outline-none focus:outline-[2px] focus:outline-lavender"
                />
              </div>

              {/* Month header */}
              <button
                onClick={() => setCollapsed(c => !c)}
                className="w-full flex items-center gap-3 text-left mb-4 hover:opacity-70 transition-opacity duration-snap"
              >
                <ChevronRight
                  size={16}
                  className={`text-stone transition-transform duration-snap ${collapsed ? '' : 'rotate-90'}`}
                  strokeWidth={2}
                />
                <span className="font-display font-bold text-[14px] tracking-[-0.02em] text-ink">2026 · PRÓXIMAS BODAS</span>
                <Tag variant="solid">{filtered.length}</Tag>
              </button>

              {!collapsed && (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.map(project => (
                    <div key={project._id} className="group relative border-[1.5px] border-ink bg-fog hover:bg-paper transition-colors duration-snap">

                      {/* Delete button (hover) */}
                      <button className="absolute top-3 right-3 p-2 opacity-0 group-hover:opacity-100 hover:bg-brick hover:text-paper text-stone transition-all duration-snap">
                        <Trash2 size={12} strokeWidth={1.5} />
                      </button>

                      {/* Ticket */}
                      <div className="absolute top-0 right-10">
                        <Ticket
                          size={36}
                          content={ticketContent(project.weddingDate)}
                          rotate={-6}
                          shadow={false}
                        />
                      </div>

                      <div className="p-5 cursor-pointer" onClick={() => navigate('/preview/timeline')}>
                        {/* Tags */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Tag variant="default">TIMELINE</Tag>
                          <Tag variant="accent" dot>{daysUntil(project.weddingDate)}</Tag>
                        </div>

                        {/* Title */}
                        <h3 className="font-display font-bold text-[22px] tracking-[-0.02em] leading-tight text-ink mb-1 pr-8">
                          {project.title.toUpperCase()}
                        </h3>

                        {/* Meta */}
                        <div className="mt-3 space-y-1">
                          <p className="alto-label text-stone">{formatDate(project.weddingDate)}</p>
                          <p className="font-mono text-[11px] text-stone leading-relaxed">{project.description}</p>
                        </div>

                        {/* Avatars */}
                        {project.collaborators.length > 0 && (
                          <div className="flex items-center gap-1 mt-4">
                            {project.collaborators.slice(0, 4).map((c, i) => (
                              <Avatar key={i} initials={c.name.slice(0, 2)} size={24} />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Invite button */}
                      <div className="border-t-[1px] border-ink/20 px-5 py-3">
                        <Button variant="ghost" size="sm" className="w-full justify-center">
                          <UserPlus size={12} strokeWidth={1.5} />
                          Invitar colaboradores
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shared timelines */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b-[1px] border-ink/20">
                <Share2 size={16} strokeWidth={1.5} className="text-stone" />
                <span className="font-display font-bold text-[18px] tracking-[-0.02em] text-ink">
                  TIMELINES COMPARTIDOS
                </span>
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {MOCK_SHARED.map(tl => (
                  <div key={tl._id} className="border-[1.5px] border-ink bg-fog hover:bg-paper transition-colors duration-snap cursor-pointer p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag variant="default">COMPARTIDO</Tag>
                    </div>
                    <h3 className="font-display font-bold text-[20px] tracking-[-0.02em] leading-tight text-ink mb-1">
                      {tl.title.toUpperCase()}
                    </h3>
                    <p className="alto-label text-stone mt-2">{formatDate(tl.weddingDate)}</p>
                    <p className="alto-label text-stone mt-1">POR {tl.owner.name.toUpperCase()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending invitation example */}
            <div className="mb-8 border-[1.5px] border-lavender bg-fog p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell size={16} strokeWidth={1.5} className="text-lavender" />
                <span className="alto-label text-ink">1 INVITACIÓN PENDIENTE</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-[1px] border-ink p-4 bg-paper">
                <div>
                  <p className="font-display font-bold text-[16px] tracking-[-0.02em] text-ink">Lucía + Miguel</p>
                  <p className="alto-label text-stone mt-1">INVITADO POR RENATA VIDAL · 2026.10.03</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="accent" arrow>Aceptar</Button>
                  <Button size="sm" variant="ghost">Declinar</Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
