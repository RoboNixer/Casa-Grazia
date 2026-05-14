import { it } from 'date-fns/locale';
import type { Locale as DateFnsLocale } from 'date-fns';

const dict = {
  dateFns: it as DateFnsLocale,

  nav: {
    home: 'Home',
    book: 'Prenota',
    gallery: 'Galleria',
    contact: 'Contatti',
  },

  header: {
    tagline: 'Villa · Istria',
    openMenu: 'Apri il menu',
    closeMenu: 'Chiudi il menu',
    mainMenu: 'Menu principale',
    cta: 'Prenota',
    languageLabel: 'Lingua',
  },

  home: {
    hero: {
      subtitle:
        'Una villa con piscina privata nel cuore dell’Istria — la fuga perfetta per 4 + 1 persone, a soli 8 minuti da Rovigno.',
      checkAvailability: 'Verifica disponibilità',
      viewGallery: 'Vedi la galleria',
      guestsLong: 'ospiti',
      guestsShort: 'osp.',
      bedroomsLong: 'camere da letto',
      bedroomsShort: 'camere',
      bathroomsLong: 'bagni',
      bathroomsShort: 'bagni',
    },
    about: {
      eyebrow: 'La villa',
      titleLead: 'Un’oasi istriana circondata da',
      titleAccent: 'oliveti',
      p1Before:
        'Casa Grazia è una accogliente casa vacanze, ristrutturata con gusto nel 2017 nel tipico stile istriano. Si trova nel villaggio di Rovinjsko Selo e può ospitare ',
      p1Bold: '4 + 1 persone',
      p1After: '.',
      p2Before: 'È circondata da un paesaggio idilliaco di ',
      p2Bold1: '2,5 ettari di terreno',
      p2Middle: ', di cui ',
      p2Bold2: '1 ettaro di oliveto',
      p2After: ', a soli 8 minuti d’auto dalla pittoresca città di Rovigno.',
      p3: 'Comprende due camere da letto, un soggiorno, una cucina completamente attrezzata, due bagni, lavastoviglie, aria condizionata, TV satellitare e un’ampia terrazza coperta con vista sull’oliveto.',
      statGuests: 'Ospiti',
      statBedrooms: 'Camere',
      statBathrooms: 'Bagni',
      imgTerrace: 'Terrazza con vista sulla piscina',
      imgPool: 'Piscina privata',
      imgCovered: 'Terrazza coperta',
    },
    amenities: {
      eyebrow: 'Servizi',
      titleLead: 'Tutto ciò che serve per',
      titleAccent: 'una vacanza perfetta',
      subtitle:
        'Dalla piscina privata alla cucina completamente attrezzata — abbiamo curato ogni dettaglio.',
    },
    gallery: {
      eyebrow: 'Galleria',
      titleLead: 'Uno sguardo',
      titleAccent: 'da vicino',
      viewAll: 'Tutte le foto',
    },
    location: {
      eyebrow: 'Posizione',
      titleLead: 'La quiete di Rovinjsko Selo,',
      titleAccent: 'a un passo da Rovigno',
      description:
        'La villa si trova in un tranquillo villaggio istriano, circondata da oliveti — il centro di Rovigno, le sue spiagge e i ristoranti sono a soli 8 minuti d’auto.',
      fallbackAddress: 'Duranka 44, 52210 Rovinjsko Selo, Croazia',
      book: 'Prenota',
      contact: 'Contatti',
      mapTitle: 'Mappa della posizione',
    },
    cta: {
      eyebrow: 'Pronti per la vacanza?',
      stayLead: 'Il vostro soggiorno a',
      subtitle:
        'Prenotate le vostre date oggi stesso. Nessun pagamento online — semplicemente pagate all’arrivo.',
      priceFrom: 'A partire da',
      perNight: '/notte',
      bookNow: 'Prenota ora',
      contactUs: 'Contattaci',
    },
  },

  book: {
    page: {
      eyebrow: 'Prenotazioni',
      titleLead: 'Prenota il tuo',
      titleAccent: 'soggiorno',
      subtitleLead:
        'Scegli le date libere nel calendario e noi confermeremo la prenotazione.',
      subtitleHighlight: 'Nessun pagamento online richiesto.',
    },
    form: {
      selectProperty: 'Seleziona la proprietà',
      selectPlaceholder: 'Seleziona la proprietà...',
      perNightSuffix: '/notte',
      upToGuestsBeforeNumber: 'Fino a ',
      upToGuestsAfter: ' ospiti',
      maxGuestsBadge: 'max',
      calendarTitleLead: 'Scegli le',
      calendarTitleAccent: 'date',
      calendarMeta: 'Arrivo / Partenza',
      selectPropertyAlert: 'Seleziona una proprietà sopra per vedere la disponibilità.',
      minNightsNoticePrefix: 'Numero minimo di notti:',
      minNightsError:
        'Hai selezionato {selected} {selectedWord}, ma il minimo è {min}. Allunga il soggiorno.',
      stayDetailsTitle: 'Dettagli del',
      stayDetailsAccent: 'soggiorno',
      guestsCount: 'Numero di ospiti',
      guestInfoTitle: 'Dati dell’',
      guestInfoAccent: 'ospite',
      fullName: 'Nome e cognome',
      fullNamePlaceholder: 'Mario Rossi',
      email: 'E-mail',
      emailPlaceholder: 'mario@esempio.it',
      phone: 'Telefono',
      phonePlaceholder: '+39 333 123 4567',
      country: 'Paese',
      countryPlaceholder: 'Italia',
      cashTitle: 'Pagamento in contanti all’arrivo.',
      cashBody:
        'Nessun pagamento online richiesto. Paga comodamente al check-in.',
      summaryEyebrow: 'Riepilogo prenotazione',
      summaryPlaceholder: 'Seleziona una proprietà',
      summaryPerNight: '/ notte',
      dateArrival: 'Arrivo',
      dateDeparture: 'Partenza',
      datePlaceholder: 'Seleziona',
      priceAccommodation: 'Soggiorno',
      priceCleaning: 'Pulizie',
      priceTotal: 'Totale',
      submitSending: 'Invio...',
      submitSend: 'Invia richiesta',
      submitSelectDates: 'Seleziona le date',
      submitMinPrefix: 'Min.',
      confirmationNote: 'Conferma di solito entro 24 ore',
      nightSingular: 'notte',
      nightPlural: 'notti',
    },
    calendar: {
      weekdays: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
      prevMonth: 'Mese precedente',
      nextMonth: 'Mese successivo',
      promptTinyLabel: 'Seleziona le date',
      promptHeadingArrival: 'Arrivo',
      promptHeadingDeparture: 'Partenza',
      pickDeparture: 'Seleziona la data di partenza',
      arrivalPrefix: 'Arrivo:',
      nightsSelectedSuffix: 'selezionate',
      clearSelection: 'Annulla selezione',
      pastDateAria: 'data passata',
      unavailableAria: 'non disponibile',
    },
    success: {
      eyebrow: 'Richiesta inviata',
      defaultGuest: 'Ospite',
      thanks: 'Grazie',
      body: 'La tua richiesta di prenotazione è stata inviata con successo.',
      emailNoteBefore: 'Confermeremo la prenotazione via e-mail all’indirizzo ',
      emailNoteAfter: '. Il pagamento avviene in contanti all’arrivo.',
      backHome: 'Torna alla home',
      viewGallery: 'Vedi la galleria',
    },
    errors: {
      fillAll: 'Compila tutti i campi.',
      checkoutAfter: 'La data di partenza deve essere successiva a quella di arrivo.',
      propertyNotFound: 'Proprietà non trovata.',
      maxGuests: 'Il numero massimo di ospiti è {n}.',
      minNights: 'Il numero minimo di notti per questa proprietà è {n}.',
      datesUnavailable: 'Le date selezionate non sono disponibili. Scegli altre date.',
      datesBlocked: 'Le date selezionate sono bloccate. Scegli altre date.',
      generic: 'Qualcosa è andato storto. Riprova.',
    },
  },

  gallery: {
    eyebrow: 'Tour visivo',
    title: 'Galleria',
    subtitle:
      'Scopri Casa Grazia da vicino — la piscina, la terrazza, gli interni e il paesaggio istriano che la circonda.',
    empty: 'Nessuna immagine disponibile.',
    close: 'Chiudi',
    prev: 'Immagine precedente',
    next: 'Immagine successiva',
    altFallback: 'Foto della galleria',
  },

  contact: {
    eyebrow: 'Mettiti in contatto',
    title: 'Contatti',
    subtitle:
      'Hai domande su Casa Grazia o hai bisogno di aiuto con la prenotazione? Scrivici — rispondiamo in fretta.',
    sectionLead: 'Mettiti in',
    sectionAccent: 'contatto',
    sectionSubtitle:
      'Di solito rispondiamo entro poche ore. Contattaci pure su uno qualsiasi dei canali qui sotto.',
    cardAddress: 'Il nostro indirizzo',
    cardPhone: 'Telefono',
    cardEmail: 'E-mail',
    cardTimes: 'Arrivo / Partenza',
    checkInLabel: 'Arrivo',
    checkOutLabel: 'Partenza',
    whatsappCta: 'Scrivici su WhatsApp',
    mapTitle: 'Mappa della posizione',
    mapUnavailable: 'Mappa non disponibile',
  },

  footer: {
    tagline: 'Villa · Istria',
    copyrightSuffix: 'Tutti i diritti riservati',
  },

  loading: {
    aria: 'Caricamento',
    caption: 'Stiamo preparando il tuo soggiorno',
  },

  propertyType: {
    apartment: 'Appartamento',
    villa: 'Villa',
    studio: 'Monolocale',
    house: 'Casa',
    room: 'Camera',
  },

  propertyCard: {
    noImage: 'Nessuna immagine',
    bedrooms: 'camere',
    bathrooms: 'bagni',
    guests: 'ospiti',
    perNight: '/ notte',
    book: 'Prenota',
  },
} as const;

export default dict;
