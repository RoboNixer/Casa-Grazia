import { de } from 'date-fns/locale';
import type { Locale as DateFnsLocale } from 'date-fns';

const dict = {
  dateFns: de as DateFnsLocale,

  nav: {
    home: 'Startseite',
    book: 'Buchen',
    gallery: 'Galerie',
    contact: 'Kontakt',
  },

  header: {
    tagline: 'Villa · Istrien',
    openMenu: 'Menü öffnen',
    closeMenu: 'Menü schließen',
    mainMenu: 'Hauptmenü',
    cta: 'Buchen',
    languageLabel: 'Sprache',
  },

  home: {
    hero: {
      subtitle:
        'Eine Villa mit privatem Pool im Herzen Istriens — die perfekte Auszeit für 4 + 1 Gäste, nur 8 Minuten von Rovinj entfernt.',
      checkAvailability: 'Verfügbarkeit prüfen',
      viewGallery: 'Galerie ansehen',
      guestsLong: 'Gäste',
      guestsShort: 'Gä.',
      bedroomsLong: 'Schlafzimmer',
      bedroomsShort: 'Zi.',
      bathroomsLong: 'Badezimmer',
      bathroomsShort: 'Bad',
    },
    about: {
      eyebrow: 'Über die Villa',
      titleLead: 'Eine istrische Oase, umgeben von',
      titleAccent: 'Olivenhainen',
      p1Before:
        'Casa Grazia ist ein gemütliches Familien-Ferienhaus, 2017 geschmackvoll im typisch istrischen Stil renoviert. Es liegt im Dorf Rovinjsko Selo und bietet Platz für ',
      p1Bold: '4 + 1 Personen',
      p1After: '.',
      p2Before: 'Umgeben ist es von einer idyllischen Landschaft auf ',
      p2Bold1: '2,5 Hektar Land',
      p2Middle: ', davon ',
      p2Bold2: '1 Hektar Olivenhain',
      p2After: ', nur 8 Autominuten vom malerischen Städtchen Rovinj entfernt.',
      p3: 'Das Haus verfügt über zwei Schlafzimmer, ein Wohnzimmer, eine voll ausgestattete Küche, zwei Bäder, einen Geschirrspüler, Klimaanlage, Sat-TV und eine großzügige überdachte Terrasse mit Blick auf den Olivenhain.',
      statGuests: 'Gäste',
      statBedrooms: 'Schlafzimmer',
      statBathrooms: 'Badezimmer',
      imgTerrace: 'Terrasse mit Poolblick',
      imgPool: 'Privater Pool',
      imgCovered: 'Überdachte Terrasse',
    },
    amenities: {
      eyebrow: 'Ausstattung',
      titleLead: 'Alles, was Sie brauchen für',
      titleAccent: 'einen perfekten Urlaub',
      subtitle:
        'Vom privaten Pool bis zur voll ausgestatteten Küche — wir haben an jedes Detail gedacht.',
    },
    gallery: {
      eyebrow: 'Galerie',
      titleLead: 'Aus der',
      titleAccent: 'Nähe gesehen',
      viewAll: 'Alle Fotos ansehen',
    },
    location: {
      eyebrow: 'Lage',
      titleLead: 'Die Ruhe von Rovinjsko Selo,',
      titleAccent: 'die Nähe zu Rovinj',
      description:
        'Die Villa liegt in einem ruhigen istrischen Dorf, umgeben von Olivenhainen — das Zentrum von Rovinj, die Strände und Restaurants sind in 8 Autominuten erreichbar.',
      fallbackAddress: 'Duranka 44, 52210 Rovinjsko Selo, Kroatien',
      book: 'Buchen',
      contact: 'Kontakt',
      mapTitle: 'Lagekarte',
    },
    cta: {
      eyebrow: 'Bereit für den Urlaub?',
      stayLead: 'Ihr Aufenthalt in der',
      subtitle:
        'Reservieren Sie noch heute Ihre Termine. Keine Online-Zahlung — Sie zahlen einfach bei der Anreise.',
      priceFrom: 'Ab',
      perNight: '/Nacht',
      bookNow: 'Jetzt buchen',
      contactUs: 'Kontaktieren Sie uns',
    },
  },

  book: {
    page: {
      eyebrow: 'Reservierungen',
      titleLead: 'Buchen Sie Ihren',
      titleAccent: 'Aufenthalt',
      subtitleLead:
        'Wählen Sie freie Termine im Kalender — wir bestätigen Ihre Reservierung.',
      subtitleHighlight: 'Keine Online-Zahlung erforderlich.',
    },
    form: {
      selectProperty: 'Unterkunft wählen',
      selectPlaceholder: 'Unterkunft wählen...',
      perNightSuffix: '/Nacht',
      upToGuestsBeforeNumber: 'Bis zu ',
      upToGuestsAfter: ' Gäste',
      maxGuestsBadge: 'max',
      calendarTitleLead: 'Wählen Sie Ihre',
      calendarTitleAccent: 'Termine',
      calendarMeta: 'Anreise / Abreise',
      selectPropertyAlert:
        'Wählen Sie oben eine Unterkunft, um die Verfügbarkeit zu sehen.',
      minNightsNoticePrefix: 'Mindestaufenthalt:',
      minNightsError:
        'Sie haben {selected} {selectedWord} gewählt, das Minimum ist jedoch {min}. Bitte verlängern Sie den Aufenthalt.',
      stayDetailsTitle: 'Details des',
      stayDetailsAccent: 'Aufenthalts',
      guestsCount: 'Anzahl der Gäste',
      guestInfoTitle: 'Angaben zum',
      guestInfoAccent: 'Gast',
      fullName: 'Vor- und Nachname',
      fullNamePlaceholder: 'Max Mustermann',
      email: 'E-Mail',
      emailPlaceholder: 'max@beispiel.de',
      phone: 'Telefon',
      phonePlaceholder: '+49 151 12345678',
      country: 'Land',
      countryPlaceholder: 'Deutschland',
      cashTitle: 'Barzahlung bei Anreise.',
      cashBody:
        'Keine Online-Zahlung nötig. Zahlen Sie bequem beim Check-in.',
      summaryEyebrow: 'Buchungsübersicht',
      summaryPlaceholder: 'Unterkunft wählen',
      summaryPerNight: '/ Nacht',
      dateArrival: 'Anreise',
      dateDeparture: 'Abreise',
      datePlaceholder: 'Wählen',
      priceAccommodation: 'Unterkunft',
      priceCleaning: 'Reinigung',
      priceTotal: 'Gesamt',
      submitSending: 'Senden...',
      submitSend: 'Anfrage senden',
      submitSelectDates: 'Termine wählen',
      submitMinPrefix: 'Min.',
      confirmationNote: 'Bestätigung meist innerhalb von 24 Stunden',
      nightSingular: 'Nacht',
      nightPlural: 'Nächte',
    },
    calendar: {
      weekdays: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
      prevMonth: 'Vorheriger Monat',
      nextMonth: 'Nächster Monat',
      promptTinyLabel: 'Wählen Sie Ihre Termine',
      promptHeadingArrival: 'Anreise',
      promptHeadingDeparture: 'Abreise',
      pickDeparture: 'Abreisedatum wählen',
      arrivalPrefix: 'Anreise:',
      nightsSelectedSuffix: 'ausgewählt',
      clearSelection: 'Auswahl zurücksetzen',
      pastDateAria: 'vergangenes Datum',
      unavailableAria: 'nicht verfügbar',
    },
    success: {
      eyebrow: 'Anfrage gesendet',
      defaultGuest: 'Gast',
      thanks: 'Danke',
      body: 'Ihre Buchungsanfrage wurde erfolgreich gesendet.',
      emailNoteBefore: 'Wir bestätigen Ihre Reservierung per E-Mail an ',
      emailNoteAfter: '. Die Zahlung erfolgt bar bei der Anreise.',
      backHome: 'Zurück zur Startseite',
      viewGallery: 'Galerie ansehen',
    },
    errors: {
      fillAll: 'Bitte füllen Sie alle Felder aus.',
      checkoutAfter: 'Das Abreisedatum muss nach dem Anreisedatum liegen.',
      propertyNotFound: 'Unterkunft nicht gefunden.',
      maxGuests: 'Die maximale Gästezahl beträgt {n}.',
      minNights: 'Der Mindestaufenthalt für diese Unterkunft beträgt {n}.',
      datesUnavailable:
        'Die gewählten Termine sind nicht verfügbar. Bitte wählen Sie andere Termine.',
      datesBlocked:
        'Die gewählten Termine sind gesperrt. Bitte wählen Sie andere Termine.',
      generic: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
    },
  },

  gallery: {
    eyebrow: 'Visuelle Tour',
    title: 'Galerie',
    subtitle:
      'Entdecken Sie Casa Grazia aus der Nähe — Pool, Terrasse, Innenräume und die istrische Landschaft drumherum.',
    empty: 'Keine Bilder verfügbar.',
    close: 'Schließen',
    prev: 'Vorheriges Bild',
    next: 'Nächstes Bild',
    altFallback: 'Galeriebild',
  },

  contact: {
    eyebrow: 'Schreiben Sie uns',
    title: 'Kontakt',
    subtitle:
      'Fragen zu Casa Grazia oder Hilfe bei einer Buchung? Schreiben Sie uns — wir antworten schnell.',
    sectionLead: 'Schreiben Sie',
    sectionAccent: 'uns',
    sectionSubtitle:
      'Wir antworten meist innerhalb weniger Stunden. Erreichen Sie uns gerne über einen der unten genannten Kanäle.',
    cardAddress: 'Unsere Adresse',
    cardPhone: 'Telefon',
    cardEmail: 'E-Mail',
    cardTimes: 'Anreise / Abreise',
    checkInLabel: 'Anreise',
    checkOutLabel: 'Abreise',
    whatsappCta: 'Schreiben Sie uns auf WhatsApp',
    mapTitle: 'Lagekarte',
    mapUnavailable: 'Karte nicht verfügbar',
  },

  footer: {
    tagline: 'Villa · Istrien',
    copyrightSuffix: 'Alle Rechte vorbehalten',
  },

  loading: {
    aria: 'Wird geladen',
    caption: 'Wir bereiten Ihren Aufenthalt vor',
  },

  propertyType: {
    apartment: 'Apartment',
    villa: 'Villa',
    studio: 'Studio',
    house: 'Haus',
    room: 'Zimmer',
  },

  propertyCard: {
    noImage: 'Kein Bild',
    bedrooms: 'Zi.',
    bathrooms: 'Bad',
    guests: 'Gäste',
    perNight: '/ Nacht',
    book: 'Buchen',
  },
} as const;

export default dict;
