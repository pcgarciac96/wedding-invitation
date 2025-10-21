type Invite = { id: string; names: string[] | string; seats: number };

const MIN_LOADER_MS = 2000;
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function $(id: string) {
  return document.getElementById(id) as HTMLElement | null;
}

function renderGuests(names: string[], seats: number) {
  const seatsCircle = $('guest-seats-circle');
  const namesList   = $('guest-names-list');

  // Compatibilidad con IDs antiguos (si existen en el DOM)
  const legacyNames = $('guest-names');
  const legacySeats = $('guest-seats');

  if (seatsCircle) seatsCircle.textContent = String(seats ?? 1);
  if (legacySeats) legacySeats.textContent = String(seats ?? 1);

  if (namesList) {
    namesList.innerHTML = '';
    names.forEach((n) => {
      const li = document.createElement('li');
      li.className = 'mx-auto w-[18rem] md:w-[22rem] rounded-xl  px-6 py-2 bg-[#E6DDC0] text-[#B88358] font-italianno  text-3xl';
      li.textContent = n;
      namesList.appendChild(li);
    });
  }

  if (legacyNames) {
    legacyNames.textContent = names.join(' & ');
  }
}

async function loadInvite() {
  const loaderEl  = $('loader');
  const contentEl = $('invite-content');
  const errEl     = $('guest-error');
  const loaderLabel = loaderEl?.querySelector('.title') as HTMLElement | null;

  // Estado inicial
  loaderEl?.classList.remove('hidden');
  contentEl?.classList.add('hidden','opacity-0');
  errEl?.classList.add('hidden');

  const id = (new URLSearchParams(location.search).get('i') ?? '').trim();

  const stayOnLoaderWithError = (msg: string) => {
    if (loaderLabel) loaderLabel.textContent = msg;
    errEl?.classList.remove('hidden');
  };

  const revealContent = () => {
    loaderEl?.classList.add('hidden');
    if (!contentEl) return;
    contentEl.classList.remove('hidden');
    requestAnimationFrame(() => {
      contentEl.classList.remove('opacity-0');
      contentEl.classList.add('opacity-100');
    });
  };

  await delay(MIN_LOADER_MS);

  try {
    if (!id) { stayOnLoaderWithError('Falta el código de invitación'); return; }

    // BASE absoluta segura
    const base = (import.meta as any).env?.BASE_URL || '/';
    const absBase = window.location.origin + (base.endsWith('/') ? base : base + '/');
    const url = new URL('invites.json', absBase).toString();

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) { stayOnLoaderWithError('No se pudo cargar la lista de invitados'); return; }

    const list = await res.json() as Invite[];
    const inv  = list.find(x => x.id === id);
    if (!inv) { stayOnLoaderWithError('El código no es válido'); return; }

    const names = Array.isArray(inv.names) ? inv.names : [String(inv.names ?? 'Invitado/a')];

    // Pintar UI
    renderGuests(names, inv.seats ?? 1);
    document.title = `Invitación — ${names.join(' & ')}`;

    revealContent();
  } catch (e) {
    console.error('[invite] error', e);
    stayOnLoaderWithError('Ocurrió un error inesperado');
  }
}

loadInvite();
