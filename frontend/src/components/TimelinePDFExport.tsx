import { Timeline, Day, Shot } from '@/types';

const formatPDFDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

const buildHTML = (timeline: Timeline) => {
  const locations =
    timeline.locationsList && timeline.locationsList.length > 0
      ? timeline.locationsList
      : timeline.location
      ? [{ name: timeline.location, url: timeline.locationUrl || '' }]
      : [];

  const sortedDays = [...(timeline.days || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const daysHTML = sortedDays
    .map((day: Day) => {
      const sortedEvents = [...day.events].sort((a, b) =>
        (a.time || '00:00').localeCompare(b.time || '00:00')
      );

      const eventsHTML = sortedEvents
        .map(
          (event) => `
          <tr>
            <td class="time">${event.time || '—'}</td>
            <td class="event-title">${event.title}</td>
            <td class="event-desc">${event.description || ''}</td>
            <td class="event-loc">${event.location || ''}</td>
          </tr>`
        )
        .join('');

      return `
        <div class="day-block">
          <div class="day-header">
            <span class="day-date">${formatPDFDate(day.date)}</span>
            ${day.label ? `<span class="day-label">${day.label}</span>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th class="col-time">Time</th>
                <th class="col-title">Event</th>
                <th class="col-desc">Notes</th>
                <th class="col-loc">Location</th>
              </tr>
            </thead>
            <tbody>${eventsHTML}</tbody>
          </table>
        </div>`;
    })
    .join('');

  // Shot list grouped by category
  const categoryLabels: Record<string, string> = {
    preparation: 'Preparation',
    details: 'Details',
    ceremony: 'Ceremony',
    first_look: 'First Look',
    family: 'Family',
    couple: 'Couple',
    cocktail: 'Cocktail',
    reception: 'Reception',
    venue: 'Venue',
    other: 'Other',
  };

  const shotsByCategory: Record<string, Shot[]> = {};
  (timeline.shotList || []).forEach((shot) => {
    if (!shotsByCategory[shot.category]) shotsByCategory[shot.category] = [];
    shotsByCategory[shot.category].push(shot);
  });

  const shotListHTML = Object.keys(shotsByCategory).length
    ? `
    <div class="section-header">Shot List</div>
    <div class="shot-grid">
      ${Object.entries(shotsByCategory)
        .map(
          ([cat, shots]) => `
        <div class="shot-category">
          <div class="shot-cat-label">${categoryLabels[cat] || cat}</div>
          ${shots
            .map(
              (s) => `
            <div class="shot-item">
              <span class="shot-check">□</span>
              <span class="shot-title">${s.title}</span>
              ${s.description ? `<span class="shot-desc"> — ${s.description}</span>` : ''}
            </div>`
            )
            .join('')}
        </div>`
        )
        .join('')}
    </div>`
    : '';

  const locationsHTML = locations.length
    ? locations
        .map(
          (l) =>
            `<span class="location-item">${l.name}${
              l.url ? ` <a href="${l.url}" style="color:#6b7280;font-size:10px;">(map)</a>` : ''
            }</span>`
        )
        .join('<span style="color:#d1d5db;margin:0 6px">·</span>')
    : '';

  const weddingDate = timeline.weddingDate
    ? new Date(timeline.weddingDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${timeline.title} — Timeline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11px;
      color: #111;
      background: #fff;
      padding: 28px 32px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #111;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }
    .meta {
      font-size: 10px;
      color: #6b7280;
      margin-top: 4px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .logo {
      font-size: 10px;
      color: #9ca3af;
      text-align: right;
      font-weight: 500;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .location-item { color: #374151; font-size: 10px; }
    .day-block { margin-bottom: 14px; }
    .day-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      background: #f3f4f6;
      padding: 5px 8px;
      border-left: 3px solid #111;
      margin-bottom: 4px;
    }
    .day-date { font-weight: 600; font-size: 11px; }
    .day-label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead tr th {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9ca3af;
      font-weight: 600;
      padding: 3px 6px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
    }
    tbody tr { border-bottom: 1px solid #f3f4f6; }
    tbody tr:last-child { border-bottom: none; }
    td { padding: 4px 6px; vertical-align: top; line-height: 1.4; }
    .time { font-weight: 600; white-space: nowrap; width: 48px; color: #111; }
    .event-title { font-weight: 500; width: 30%; }
    .event-desc { color: #6b7280; width: 40%; font-size: 10px; }
    .event-loc { color: #9ca3af; font-size: 10px; width: 20%; }
    .col-time { width: 48px; }
    .col-title { width: 30%; }
    .col-desc { width: 40%; }
    .col-loc { width: 20%; }
    .footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #9ca3af;
    }
    .section-header {
      font-size: 13px;
      font-weight: 700;
      border-bottom: 2px solid #111;
      padding-bottom: 6px;
      margin: 20px 0 10px;
    }
    .shot-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px 20px;
    }
    .shot-category { break-inside: avoid; }
    .shot-cat-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9ca3af;
      font-weight: 600;
      margin-bottom: 4px;
      padding-bottom: 2px;
      border-bottom: 1px solid #f3f4f6;
    }
    .shot-item {
      display: flex;
      align-items: baseline;
      gap: 4px;
      padding: 2px 0;
      font-size: 10px;
      border-bottom: 1px solid #f9fafb;
    }
    .shot-check { color: #d1d5db; flex-shrink: 0; }
    .shot-title { font-weight: 500; color: #111; }
    .shot-desc { color: #9ca3af; font-size: 9px; }
    @media print {
      body { padding: 16px 20px; }
      @page { margin: 1cm; size: letter portrait; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">${timeline.title}</div>
      <div class="meta">
        ${weddingDate ? `<span>${weddingDate}</span>` : ''}
        ${locationsHTML ? `<span>${locationsHTML}</span>` : ''}
        ${timeline.startTime || timeline.endTime ? `<span>${[timeline.startTime, timeline.endTime].filter(Boolean).join(' — ')}</span>` : ''}
      </div>
    </div>
    <div class="logo">Lenzu</div>
  </div>

  ${daysHTML || '<p style="color:#9ca3af;font-size:11px;">No events added yet.</p>'}

  ${shotListHTML}

  <div class="footer">
    <span>Generated by Lenzu · lenzu.app</span>
    <span>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
  </div>

  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;
};

export const exportTimelinePDF = (timeline: Timeline) => {
  const html = buildHTML(timeline);
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
};
