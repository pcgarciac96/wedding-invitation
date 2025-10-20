type Invite = { id: string; names: string[] | string; seats: number };

const MIN_LOADER_MS = 2000;
function delay(ms:number){ return new Promise(r=>setTimeout(r,ms)); }

async function loadInvite() {
  const loaderEl  = document.getElementById('loader')!;
  const contentEl = document.getElementById('invite-content')!;
  const namesEl   = document.getElementById('guest-names')!;
  const seatsEl   = document.getElementById('guest-seats')!;
  const errEl     = document.getElementById('guest-error') as HTMLElement;
  const loaderLabel = loaderEl.querySelector('.title') as HTMLElement | null;

  // Estado inicial
  loaderEl.classList.remove('hidden');
  contentEl.classList.add('hidden','opacity-0');
  errEl.classList.add('hidden');

  const id = (new URLSearchParams(location.search).get('i') ?? '').trim();

  const stayOnLoaderWithError = (msg: string) => {
    if (loaderLabel) loaderLabel.textContent = msg;
    namesEl.textContent = '—';
    seatsEl.textContent = '—';
    errEl.classList.remove('hidden');
  };

  const revealContent = () => {
    loaderEl.classList.add('hidden');
    contentEl.classList.remove('hidden');
    requestAnimationFrame(()=>{
      contentEl.classList.remove('opacity-0');
      contentEl.classList.add('opacity-100');
    });
  };

  await delay(MIN_LOADER_MS);

  try {
    if (!id) { stayOnLoaderWithError('Falta el código de invitación'); return; }

    // ✅ BASE absoluta (evita excepción de new URL con '/')
    const base = (import.meta as any).env?.BASE_URL || '/';
    const absBase = window.location.origin + (base.endsWith('/') ? base : base + '/');
    const url = new URL('invites.json', absBase).toString();

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) { stayOnLoaderWithError('No se pudo cargar la lista de invitados'); return; }

    const list = await res.json() as Invite[];
    const inv  = list.find(x => x.id === id);
    if (!inv) { stayOnLoaderWithError('El código no es válido'); return; }

    const names = Array.isArray(inv.names) ? inv.names.join(' & ') : String(inv.names ?? 'Invitado/a');
    namesEl.textContent = names;
    seatsEl.textContent = String(inv.seats ?? 1);
    document.title = `Invitación — ${names}`;

    revealContent(); // 👈 solo si el ID existe
  } catch (e) {
    console.error('[invite] error', e); // útil para depurar
    stayOnLoaderWithError('Ocurrió un error inesperado');
  }
}

loadInvite();
