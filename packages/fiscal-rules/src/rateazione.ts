/**
 * Piano di rateazione di saldo e primo acconto (imposte e contributi INPS).
 *
 * Fonti:
 * - D.Lgs. 24 marzo 2025 n. 33 (Testo unico versamenti e riscossione), art. 10:
 *   rate mensili di uguale importo, con interessi, ciascuna entro il giorno 16 del
 *   mese; il piano deve completarsi entro il 16 dicembre dello stesso anno.
 *   Art. 11: gli adempimenti con scadenza 1-20 agosto slittano al 20 agosto.
 *   (In vigore dal 1/1/2026; prima: art. 20 D.Lgs. 241/97 come modificato dal
 *   D.Lgs. 1/2024 art. 8, applicabile dal saldo 2023.)
 * - Istruzioni Modello Redditi PF 2026, Fascicolo 1, par. "Rateazione":
 *   interessi 4% annuo con metodo commerciale: 0,18% sulla seconda rata, poi
 *   +0,33% per ciascuna rata successiva, versati separatamente (cod. tributo 1668).
 *
 * Il numero di rate NON è fisso: dipende dalla data della prima rata (30/6
 * ordinaria, 30/7 con maggiorazione 0,40%, oppure la data di una proroga
 * annuale). Per questo il calcolo parte sempre dalla data effettiva.
 */

export interface RateazioneParams {
  /** Importo complessivo da rateizzare, già maggiorato se si usa il differimento. */
  importo: number;
  /** Data di scadenza della prima rata (es. 2026-06-30, 2026-07-20 con proroga). */
  primaRata: Date;
  /** Numero di rate scelto dal contribuente; se omesso, il massimo consentito. */
  numeroRate?: number;
  /** Giorno del mese delle rate successive alla prima (art. 10 c. 4: 16). */
  giornoRata?: number;
  /** Mese e giorno entro cui completare il piano (art. 10 c. 1: 16 dicembre). */
  fine?: { mese: number; giorno: number };
  /** Interessi: percentuale sulla seconda rata e incremento per ogni rata successiva. */
  interessi?: { secondaRata: number; incremento: number };
}

export interface Rata {
  numero: number;
  scadenza: Date;
  quota: number;
  /** Percentuale di interesse applicata alla quota (0 sulla prima rata). */
  interessePercentuale: number;
  interessi: number;
  totale: number;
}

const DEFAULT_GIORNO_RATA = 16;
const DEFAULT_FINE = { mese: 12, giorno: 16 };
const DEFAULT_INTERESSI = { secondaRata: 0.18, incremento: 0.33 };

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function utc(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Art. 11 D.Lgs. 33/2025: le scadenze dal 1° al 20 agosto si effettuano entro il 20
 * agosto senza maggiorazione.
 */
export function applicaDifferimentoAgosto(data: Date): Date {
  const m = data.getUTCMonth() + 1;
  const d = data.getUTCDate();
  if (m === 8 && d >= 1 && d <= 20) {
    return utc(data.getUTCFullYear(), 8, 20);
  }
  return data;
}

/**
 * Scadenze delle rate successive alla prima: il 16 di ogni mese successivo a
 * quello della prima rata, fino al 16 dicembre incluso.
 */
export function scadenzeMassime(
  primaRata: Date,
  giornoRata = DEFAULT_GIORNO_RATA,
  fine = DEFAULT_FINE,
): Date[] {
  const anno = primaRata.getUTCFullYear();
  const limite = utc(anno, fine.mese, fine.giorno);
  if (primaRata.getTime() > limite.getTime()) {
    throw new Error('La prima rata è successiva al termine ultimo del piano');
  }
  const out: Date[] = [primaRata];
  let mese = primaRata.getUTCMonth() + 2; // mese successivo (1-based)
  while (mese <= fine.mese) {
    const s = applicaDifferimentoAgosto(utc(anno, mese, giornoRata));
    if (s.getTime() > limite.getTime()) break;
    out.push(s);
    mese += 1;
  }
  return out;
}

export function numeroMassimoRate(primaRata: Date): number {
  return scadenzeMassime(primaRata).length;
}

export function calcolaPianoRateazione(params: RateazioneParams): Rata[] {
  const giornoRata = params.giornoRata ?? DEFAULT_GIORNO_RATA;
  const fine = params.fine ?? DEFAULT_FINE;
  const interessi = params.interessi ?? DEFAULT_INTERESSI;

  const scadenze = scadenzeMassime(params.primaRata, giornoRata, fine);
  const n = params.numeroRate ?? scadenze.length;
  if (n < 1 || n > scadenze.length) {
    throw new Error(
      `Numero di rate non valido: ${n} (massimo ${scadenze.length} partendo dal ${params.primaRata.toISOString().slice(0, 10)})`,
    );
  }

  const quota = round2(params.importo / n);
  const rate: Rata[] = [];
  let residuo = round2(params.importo);
  for (let i = 0; i < n; i++) {
    const isUltima = i === n - 1;
    const q = isUltima ? residuo : quota; // l'ultima assorbe l'arrotondamento
    residuo = round2(residuo - q);
    const pct = i === 0 ? 0 : round2(interessi.secondaRata + interessi.incremento * (i - 1));
    const int = round2((q * pct) / 100);
    rate.push({
      numero: i + 1,
      scadenza: scadenze[i],
      quota: q,
      interessePercentuale: pct,
      interessi: int,
      totale: round2(q + int),
    });
  }
  return rate;
}
