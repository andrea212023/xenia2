import { createScene } from './scene.js';

(() => {
  const $ = id => document.getElementById(id);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- languages ---------- */
  const L = {
    en: {
      tagline: "A friend from elsewhere keeps your message.",
      s_closed: "She is asleep. The flowers flinch when you reach for them.",
      s_flinch: "They flinch. She wakes for an answer, never for force.",
      s_unknown: "She does not know you yet.",
      s_known: "She knows you. Press and hold, and stay while the flowers open.",
      s_open: "Everything is open. This was written for you.",
      tab_open: "Open a card", tab_grow: "Grow a card",
      demo: "Example card. Its answer is: {a}", asks: "She asks",
      answer: "Your answer", answer_btn: "Answer her",
      hint: "Capitals and extra spaces do not matter. Spelling does.",
      ok: "She knows you.",
      wrong: "She looks away. That is not the answer she is waiting for. Check the spelling and try again.",
      hold: "Press and hold the picture. The flowers open while you stay.", auto: "Open them for me",
      plant_sum: "Were you sent a seed? Plant it here", seed: "Seed", plant_btn: "Plant this seed",
      plant_ok: "Planted. Answer her question above.",
      plant_err: "This does not look like a whole seed. Copy all of it, starting with XEN1, and paste again.",
      msg: "Your message", msg_ph: "Write what only they should read.",
      q: "The question she will ask", q_s: "Something only your person can answer.", q_ph: "What did we name the pigeon?",
      a: "The answer that wakes her", a_s: "This becomes the key. A longer, stranger answer is harder to guess.",
      seal: "Seal the card",
      note: "The message is encrypted in your browser with the answer. Without the answer nobody can read it, and neither can this page.",
      seal_err: "Sealing failed in this browser. Try a current version of Chrome, Safari or Firefox.",
      link: "Link to the card", copy_link: "Copy the link", copy_seed: "Copy the seed only", try: "Open it as the receiver",
      share: "Send the link to your person. It opens the card directly.",
      copied: "Copied. Send it to your person.",
      manual: "It is selected. Copy it with your keyboard or the copy menu.",
      nocrypto: "This browser blocks the encryption this page needs. Open the page over https in a current browser.",
      lang: "Language",
      dq: "What do we call the hour when only the two of us are awake?", da: "the blue hour",
      dm: "You were never strange. You are from the same place I am. Come home whenever you like."
    },
    uk: {
      tagline: "Подруга з іншого світу береже твоє послання.",
      s_closed: "Вона спить. Квіти здригаються, коли до них тягнешся.",
      s_flinch: "Вони здригаються. Її будить відповідь, а не сила.",
      s_unknown: "Вона тебе ще не впізнає.",
      s_known: "Вона тебе впізнала. Натисни й тримай, залишайся, доки квіти розкриваються.",
      s_open: "Усе розкрилося. Це написано для тебе.",
      tab_open: "Відкрити листівку", tab_grow: "Виростити листівку",
      demo: "Приклад листівки. Відповідь: {a}", asks: "Вона питає",
      answer: "Твоя відповідь", answer_btn: "Відповісти",
      hint: "Великі літери й зайві пробіли не мають значення. Правопис має.",
      ok: "Вона тебе впізнала.",
      wrong: "Вона відводить погляд. Це не та відповідь, на яку вона чекає. Перевір правопис і спробуй ще раз.",
      hold: "Натисни й тримай зображення. Квіти розкриваються, доки ти поруч.", auto: "Розкрити за мене",
      plant_sum: "Тобі надіслали насінину? Посади її тут", seed: "Насінина", plant_btn: "Посадити насінину",
      plant_ok: "Посаджено. Дай відповідь на її запитання вище.",
      plant_err: "Це не схоже на цілу насінину. Скопіюй її повністю, починаючи з XEN1, і встав ще раз.",
      msg: "Твоє послання", msg_ph: "Напиши те, що має прочитати лише одна людина.",
      q: "Запитання, яке вона поставить", q_s: "Щось, на що може відповісти лише твоя людина.", q_ph: "Як ми назвали того голуба?",
      a: "Відповідь, яка її розбудить", a_s: "Вона стане ключем. Довшу й дивнішу відповідь важче вгадати.",
      seal: "Запечатати листівку",
      note: "Послання шифрується у твоєму браузері за допомогою відповіді. Без відповіді його не прочитає ніхто, навіть ця сторінка.",
      seal_err: "Не вдалося запечатати в цьому браузері. Спробуй актуальну версію Chrome, Safari або Firefox.",
      link: "Посилання на листівку", copy_link: "Скопіювати посилання", copy_seed: "Скопіювати лише насінину", try: "Відкрити як отримувач",
      share: "Надішли посилання своїй людині. Воно одразу відкриває листівку.",
      copied: "Скопійовано. Надішли своїй людині.",
      manual: "Текст виділено. Скопіюй його клавіатурою або через меню.",
      nocrypto: "Цей браузер блокує шифрування, потрібне сторінці. Відкрий її через https в актуальному браузері.",
      lang: "Мова",
      dq: "Як ми називаємо годину, коли не спимо лише ми двоє?", da: "синя година",
      dm: "У тобі ніколи не було нічого дивного. Ти з того самого місця, що і я. Повертайся додому, коли захочеш."
    },
    de: {
      tagline: "Eine Freundin von anderswo hütet deine Nachricht.",
      s_closed: "Sie schläft. Die Blumen zucken zurück, wenn du nach ihnen greifst.",
      s_flinch: "Sie zucken zurück. Eine Antwort weckt sie, niemals Gewalt.",
      s_unknown: "Sie erkennt dich noch nicht.",
      s_known: "Sie erkennt dich. Drücke und halte, und bleib, während die Blumen sich öffnen.",
      s_open: "Alles ist offen. Das wurde für dich geschrieben.",
      tab_open: "Karte öffnen", tab_grow: "Karte züchten",
      demo: "Beispielkarte. Die Antwort lautet: {a}", asks: "Sie fragt",
      answer: "Deine Antwort", answer_btn: "Antworten",
      hint: "Großschreibung und zusätzliche Leerzeichen sind egal. Die Schreibweise nicht.",
      ok: "Sie erkennt dich.",
      wrong: "Sie wendet den Blick ab. Das ist nicht die Antwort, auf die sie wartet. Prüfe die Schreibweise und versuche es noch einmal.",
      hold: "Drücke und halte das Bild. Die Blumen öffnen sich, solange du bleibst.", auto: "Für mich öffnen",
      plant_sum: "Hast du einen Samen bekommen? Pflanze ihn hier", seed: "Samen", plant_btn: "Samen pflanzen",
      plant_ok: "Gepflanzt. Beantworte oben ihre Frage.",
      plant_err: "Das sieht nicht nach einem ganzen Samen aus. Kopiere ihn vollständig, beginnend mit XEN1, und füge ihn erneut ein.",
      msg: "Deine Nachricht", msg_ph: "Schreib, was nur eine Person lesen soll.",
      q: "Die Frage, die sie stellen wird", q_s: "Etwas, das nur dein Mensch beantworten kann.", q_ph: "Wie haben wir die Taube genannt?",
      a: "Die Antwort, die sie weckt", a_s: "Sie wird zum Schlüssel. Eine längere, seltsamere Antwort ist schwerer zu erraten.",
      seal: "Karte versiegeln",
      note: "Die Nachricht wird in deinem Browser mit der Antwort verschlüsselt. Ohne die Antwort kann niemand sie lesen, auch diese Seite nicht.",
      seal_err: "Das Versiegeln ist in diesem Browser fehlgeschlagen. Versuche eine aktuelle Version von Chrome, Safari oder Firefox.",
      link: "Link zur Karte", copy_link: "Link kopieren", copy_seed: "Nur den Samen kopieren", try: "Als Empfänger öffnen",
      share: "Schick den Link an deinen Menschen. Er öffnet die Karte direkt.",
      copied: "Kopiert. Schick es an deinen Menschen.",
      manual: "Der Text ist markiert. Kopiere ihn mit der Tastatur oder über das Menü.",
      nocrypto: "Dieser Browser blockiert die Verschlüsselung, die diese Seite braucht. Öffne die Seite über https in einem aktuellen Browser.",
      lang: "Sprache",
      dq: "Wie nennen wir die Stunde, in der nur wir zwei wach sind?", da: "die blaue stunde",
      dm: "Du warst nie seltsam. Du kommst vom selben Ort wie ich. Komm nach Hause, wann immer du willst."
    },
    pl: {
      tagline: "Przyjaciółka z innego świata strzeże twojej wiadomości.",
      s_closed: "Ona śpi. Kwiaty cofają się, gdy po nie sięgasz.",
      s_flinch: "Cofają się. Budzi ją odpowiedź, nigdy siła.",
      s_unknown: "Jeszcze cię nie poznaje.",
      s_known: "Poznała cię. Naciśnij i przytrzymaj, zostań, aż kwiaty się otworzą.",
      s_open: "Wszystko się otworzyło. To zostało napisane dla ciebie.",
      tab_open: "Otwórz kartkę", tab_grow: "Wyhoduj kartkę",
      demo: "Przykładowa kartka. Odpowiedź: {a}", asks: "Ona pyta",
      answer: "Twoja odpowiedź", answer_btn: "Odpowiedz",
      hint: "Wielkie litery i dodatkowe spacje nie mają znaczenia. Pisownia ma.",
      ok: "Poznała cię.",
      wrong: "Odwraca wzrok. To nie jest odpowiedź, na którą czeka. Sprawdź pisownię i spróbuj ponownie.",
      hold: "Naciśnij i przytrzymaj obraz. Kwiaty otwierają się, dopóki zostajesz.", auto: "Otwórz za mnie",
      plant_sum: "Masz nasiono od kogoś? Zasadź je tutaj", seed: "Nasiono", plant_btn: "Zasadź nasiono",
      plant_ok: "Zasadzone. Odpowiedz na jej pytanie powyżej.",
      plant_err: "To nie wygląda na całe nasiono. Skopiuj je w całości, zaczynając od XEN1, i wklej ponownie.",
      msg: "Twoja wiadomość", msg_ph: "Napisz to, co ma przeczytać tylko jedna osoba.",
      q: "Pytanie, które ona zada", q_s: "Coś, na co odpowie tylko twoja osoba.", q_ph: "Jak nazwaliśmy tego gołębia?",
      a: "Odpowiedź, która ją obudzi", a_s: "Stanie się kluczem. Dłuższą i dziwniejszą odpowiedź trudniej zgadnąć.",
      seal: "Zapieczętuj kartkę",
      note: "Wiadomość jest szyfrowana w twojej przeglądarce za pomocą odpowiedzi. Bez odpowiedzi nikt jej nie przeczyta, ta strona również.",
      seal_err: "Nie udało się zapieczętować w tej przeglądarce. Spróbuj aktualnej wersji Chrome, Safari lub Firefoksa.",
      link: "Link do kartki", copy_link: "Skopiuj link", copy_seed: "Skopiuj samo nasiono", try: "Otwórz jako odbiorca",
      share: "Wyślij link swojej osobie. Otwiera kartkę od razu.",
      copied: "Skopiowano. Wyślij swojej osobie.",
      manual: "Tekst jest zaznaczony. Skopiuj go klawiaturą lub z menu.",
      nocrypto: "Ta przeglądarka blokuje szyfrowanie potrzebne tej stronie. Otwórz stronę przez https w aktualnej przeglądarce.",
      lang: "Język",
      dq: "Jak nazywamy godzinę, w której nie śpimy tylko my dwoje?", da: "niebieska godzina",
      dm: "Nigdy nie było w tobie nic dziwnego. Jesteś z tego samego miejsca co ja. Wracaj do domu, kiedy tylko zechcesz."
    },
    nl: {
      tagline: "Een vriendin van elders bewaart je bericht.",
      s_closed: "Ze slaapt. De bloemen deinzen terug als je naar ze reikt.",
      s_flinch: "Ze deinzen terug. Een antwoord wekt haar, dwang nooit.",
      s_unknown: "Ze herkent je nog niet.",
      s_known: "Ze herkent je. Houd ingedrukt en blijf terwijl de bloemen opengaan.",
      s_open: "Alles is open. Dit is voor jou geschreven.",
      tab_open: "Kaart openen", tab_grow: "Kaart kweken",
      demo: "Voorbeeldkaart. Het antwoord is: {a}", asks: "Ze vraagt",
      answer: "Jouw antwoord", answer_btn: "Antwoorden",
      hint: "Hoofdletters en extra spaties maken niet uit. Spelling wel.",
      ok: "Ze herkent je.",
      wrong: "Ze kijkt weg. Dat is niet het antwoord waarop ze wacht. Controleer de spelling en probeer het opnieuw.",
      hold: "Houd de afbeelding ingedrukt. De bloemen gaan open zolang je blijft.", auto: "Open ze voor mij",
      plant_sum: "Heb je een zaadje gekregen? Plant het hier", seed: "Zaadje", plant_btn: "Zaadje planten",
      plant_ok: "Geplant. Beantwoord haar vraag hierboven.",
      plant_err: "Dit lijkt geen volledig zaadje. Kopieer het helemaal, vanaf XEN1, en plak het opnieuw.",
      msg: "Jouw bericht", msg_ph: "Schrijf wat maar één persoon mag lezen.",
      q: "De vraag die ze zal stellen", q_s: "Iets wat alleen jouw persoon kan beantwoorden.", q_ph: "Hoe noemden we die duif?",
      a: "Het antwoord dat haar wekt", a_s: "Dit wordt de sleutel. Een langer, vreemder antwoord is moeilijker te raden.",
      seal: "Kaart verzegelen",
      note: "Het bericht wordt in je browser versleuteld met het antwoord. Zonder het antwoord kan niemand het lezen, ook deze pagina niet.",
      seal_err: "Verzegelen is mislukt in deze browser. Probeer een recente versie van Chrome, Safari of Firefox.",
      link: "Link naar de kaart", copy_link: "Link kopiëren", copy_seed: "Alleen het zaadje kopiëren", try: "Openen als ontvanger",
      share: "Stuur de link naar jouw persoon. Die opent de kaart direct.",
      copied: "Gekopieerd. Stuur het naar jouw persoon.",
      manual: "De tekst is geselecteerd. Kopieer hem met je toetsenbord of via het menu.",
      nocrypto: "Deze browser blokkeert de versleuteling die deze pagina nodig heeft. Open de pagina via https in een recente browser.",
      lang: "Taal",
      dq: "Hoe noemen we het uur waarop alleen wij tweeën wakker zijn?", da: "het blauwe uur",
      dm: "Je was nooit vreemd. Je komt van dezelfde plek als ik. Kom naar huis wanneer je maar wilt."
    },
    es: {
      tagline: "Una amiga de otro mundo guarda tu mensaje.",
      s_closed: "Está dormida. Las flores se encogen cuando intentas tocarlas.",
      s_flinch: "Se encogen. La despierta una respuesta, nunca la fuerza.",
      s_unknown: "Todavía no te reconoce.",
      s_known: "Te reconoce. Mantén pulsado y quédate mientras las flores se abren.",
      s_open: "Todo está abierto. Esto fue escrito para ti.",
      tab_open: "Abrir una tarjeta", tab_grow: "Cultivar una tarjeta",
      demo: "Tarjeta de ejemplo. Su respuesta es: {a}", asks: "Ella pregunta",
      answer: "Tu respuesta", answer_btn: "Responder",
      hint: "Las mayúsculas y los espacios de más no importan. La ortografía sí.",
      ok: "Te reconoce.",
      wrong: "Aparta la mirada. No es la respuesta que espera. Revisa la ortografía e inténtalo de nuevo.",
      hold: "Mantén pulsada la imagen. Las flores se abren mientras te quedas.", auto: "Ábrelas por mí",
      plant_sum: "¿Te enviaron una semilla? Plántala aquí", seed: "Semilla", plant_btn: "Plantar la semilla",
      plant_ok: "Plantada. Responde su pregunta arriba.",
      plant_err: "Esto no parece una semilla completa. Cópiala entera, empezando por XEN1, y pégala otra vez.",
      msg: "Tu mensaje", msg_ph: "Escribe lo que solo una persona debe leer.",
      q: "La pregunta que ella hará", q_s: "Algo que solo tu persona puede responder.", q_ph: "¿Cómo llamamos a aquella paloma?",
      a: "La respuesta que la despierta", a_s: "Se convierte en la llave. Una respuesta más larga y más rara es más difícil de adivinar.",
      seal: "Sellar la tarjeta",
      note: "El mensaje se cifra en tu navegador con la respuesta. Sin la respuesta nadie puede leerlo, tampoco esta página.",
      seal_err: "No se pudo sellar en este navegador. Prueba una versión actual de Chrome, Safari o Firefox.",
      link: "Enlace a la tarjeta", copy_link: "Copiar el enlace", copy_seed: "Copiar solo la semilla", try: "Abrirla como destinatario",
      share: "Envía el enlace a tu persona. Abre la tarjeta directamente.",
      copied: "Copiado. Envíaselo a tu persona.",
      manual: "El texto está seleccionado. Cópialo con el teclado o con el menú.",
      nocrypto: "Este navegador bloquea el cifrado que esta página necesita. Abre la página por https en un navegador actual.",
      lang: "Idioma",
      dq: "¿Cómo llamamos a la hora en que solo nosotros dos estamos despiertos?", da: "la hora azul",
      dm: "Nunca hubo nada extraño en ti. Vienes del mismo lugar que yo. Vuelve a casa cuando quieras."
    },
    pt: {
      tagline: "Uma amiga de outro mundo guarda a tua mensagem.",
      s_closed: "Ela dorme. As flores encolhem-se quando tentas tocar-lhes.",
      s_flinch: "Encolhem-se. Só uma resposta a acorda, nunca a força.",
      s_unknown: "Ela ainda não te reconhece.",
      s_known: "Ela reconhece-te. Prime e mantém, e fica enquanto as flores se abrem.",
      s_open: "Tudo está aberto. Isto foi escrito para ti.",
      tab_open: "Abrir um cartão", tab_grow: "Cultivar um cartão",
      demo: "Cartão de exemplo. A resposta é: {a}", asks: "Ela pergunta",
      answer: "A tua resposta", answer_btn: "Responder",
      hint: "Maiúsculas e espaços a mais não importam. A ortografia sim.",
      ok: "Ela reconhece-te.",
      wrong: "Ela desvia o olhar. Não é a resposta que espera. Verifica a ortografia e tenta de novo.",
      hold: "Prime e mantém a imagem. As flores abrem-se enquanto ficas.", auto: "Abre-as por mim",
      plant_sum: "Enviaram-te uma semente? Planta-a aqui", seed: "Semente", plant_btn: "Plantar a semente",
      plant_ok: "Plantada. Responde à pergunta dela acima.",
      plant_err: "Isto não parece uma semente completa. Copia-a toda, a começar por XEN1, e cola outra vez.",
      msg: "A tua mensagem", msg_ph: "Escreve o que só uma pessoa deve ler.",
      q: "A pergunta que ela fará", q_s: "Algo a que só a tua pessoa sabe responder.", q_ph: "Que nome demos àquele pombo?",
      a: "A resposta que a acorda", a_s: "Torna-se a chave. Uma resposta mais longa e mais estranha é mais difícil de adivinhar.",
      seal: "Selar o cartão",
      note: "A mensagem é cifrada no teu navegador com a resposta. Sem a resposta ninguém a consegue ler, nem esta página.",
      seal_err: "Não foi possível selar neste navegador. Experimenta uma versão atual do Chrome, Safari ou Firefox.",
      link: "Ligação para o cartão", copy_link: "Copiar a ligação", copy_seed: "Copiar só a semente", try: "Abrir como destinatário",
      share: "Envia a ligação à tua pessoa. Abre o cartão diretamente.",
      copied: "Copiado. Envia à tua pessoa.",
      manual: "O texto está selecionado. Copia-o com o teclado ou pelo menu.",
      nocrypto: "Este navegador bloqueia a cifra de que esta página precisa. Abre a página por https num navegador atual.",
      lang: "Idioma",
      dq: "Como chamamos à hora em que só nós os dois estamos acordados?", da: "a hora azul",
      dm: "Nunca houve nada de estranho em ti. Vens do mesmo lugar que eu. Volta para casa quando quiseres."
    },
    fr: {
      tagline: "Une amie venue d'ailleurs garde ton message.",
      s_closed: "Elle dort. Les fleurs se rétractent quand tu tends la main.",
      s_flinch: "Elles se rétractent. Seule une réponse la réveille, jamais la force.",
      s_unknown: "Elle ne te reconnaît pas encore.",
      s_known: "Elle te reconnaît. Appuie et maintiens, reste pendant que les fleurs s'ouvrent.",
      s_open: "Tout est ouvert. Ceci a été écrit pour toi.",
      tab_open: "Ouvrir une carte", tab_grow: "Cultiver une carte",
      demo: "Carte d'exemple. Sa réponse est : {a}", asks: "Elle demande",
      answer: "Ta réponse", answer_btn: "Répondre",
      hint: "Les majuscules et les espaces en trop ne comptent pas. L'orthographe, si.",
      ok: "Elle te reconnaît.",
      wrong: "Elle détourne le regard. Ce n'est pas la réponse qu'elle attend. Vérifie l'orthographe et réessaie.",
      hold: "Appuie sur l'image et maintiens. Les fleurs s'ouvrent tant que tu restes.", auto: "Ouvre-les pour moi",
      plant_sum: "On t'a envoyé une graine ? Plante-la ici", seed: "Graine", plant_btn: "Planter la graine",
      plant_ok: "Plantée. Réponds à sa question ci-dessus.",
      plant_err: "Cela ne ressemble pas à une graine entière. Copie-la en entier, à partir de XEN1, et colle-la de nouveau.",
      msg: "Ton message", msg_ph: "Écris ce qu'une seule personne doit lire.",
      q: "La question qu'elle posera", q_s: "Quelque chose que seule ta personne peut savoir.", q_ph: "Quel nom avons-nous donné au pigeon ?",
      a: "La réponse qui la réveille", a_s: "Elle devient la clé. Une réponse plus longue et plus étrange est plus difficile à deviner.",
      seal: "Sceller la carte",
      note: "Le message est chiffré dans ton navigateur avec la réponse. Sans la réponse, personne ne peut le lire, pas même cette page.",
      seal_err: "Le scellement a échoué dans ce navigateur. Essaie une version récente de Chrome, Safari ou Firefox.",
      link: "Lien vers la carte", copy_link: "Copier le lien", copy_seed: "Copier seulement la graine", try: "L'ouvrir comme destinataire",
      share: "Envoie le lien à ta personne. Il ouvre la carte directement.",
      copied: "Copié. Envoie-le à ta personne.",
      manual: "Le texte est sélectionné. Copie-le au clavier ou avec le menu.",
      nocrypto: "Ce navigateur bloque le chiffrement dont cette page a besoin. Ouvre la page en https dans un navigateur récent.",
      lang: "Langue",
      dq: "Comment appelle-t-on l'heure où nous sommes les deux seuls éveillés ?", da: "l'heure bleue",
      dm: "Tu n'as jamais été étrange. Tu viens du même endroit que moi. Reviens à la maison quand tu veux."
    }
  };
  let lang = 'en';
  const t = k => (L[lang] && L[lang][k]) || L.en[k] || '';
  function say(id, key, cls) {
    const el = $(id);
    el.dataset.k = key;
    if (cls) el.className = cls;
    el.textContent = t(key);
  }
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-k]').forEach(el => { if (el.dataset.k) el.textContent = t(el.dataset.k); });
    document.querySelectorAll('[data-kp]').forEach(el => { el.placeholder = t(el.dataset.kp); });
    $('demo-chip').textContent = t('demo').replace('{a}', t('da'));
    $('lang').value = lang;
  }

  /* ---------- seed format and encryption ---------- */
  const enc = new TextEncoder(), dec = new TextDecoder();
  const norm = s => s.normalize('NFKC').toLowerCase().replace(/[‘’ʼ`´]/g, "'").trim().replace(/\s+/g, ' ');
  const b64u = bytes => {
    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const unb64u = str => {
    const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  };
  async function keyFrom(answer, salt) {
    const base = await crypto.subtle.importKey('raw', enc.encode(norm(answer)), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function seal(message, question, answer) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await keyFrom(answer, salt);
    const qBytes = enc.encode(question);
    const ct = new Uint8Array(await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: qBytes }, key, enc.encode(message)));
    const body = new Uint8Array(28 + ct.length);
    body.set(salt, 0); body.set(iv, 16); body.set(ct, 28);
    return 'XEN1.' + b64u(qBytes) + '.' + b64u(body);
  }
  function parseSeed(text) {
    const parts = text.replace(/\s+/g, '').split('.');
    if (parts.length !== 3 || parts[0] !== 'XEN1') throw new Error('format');
    const qBytes = unb64u(parts[1]);
    const body = unb64u(parts[2]);
    if (body.length < 28 + 17) throw new Error('short');
    return { seed: parts.join('.'), qBytes, question: dec.decode(qBytes), salt: body.slice(0, 16), iv: body.slice(16, 28), ct: body.slice(28) };
  }
  async function unseal(card, answer) {
    const key = await keyFrom(answer, card.salt);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: card.iv, additionalData: card.qBytes }, key, card.ct);
    return dec.decode(pt);
  }

  /* ---------- the invented script ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let x = a;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  const GRID = [4, 12, 20];
  function glyph(seed) {
    const r = rng(seed * 2654435761);
    const pt = () => [GRID[Math.floor(r() * 3)], GRID[Math.floor(r() * 3)]];
    let d = '';
    const n = 2 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      if (r() < 0.22) {
        const [x, y] = pt();
        d += `M${x - 2} ${y}a2 2 0 1 0 4 0a2 2 0 1 0 -4 0`;
      } else {
        const [x1, y1] = pt(), [x2, y2] = pt(), [cx, cy] = pt();
        if (x1 === x2 && y1 === y2) d += `M${x1} ${y1}L${24 - x1} ${y1 === 12 ? 4 : y1}`;
        else d += `M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`;
      }
    }
    return `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;
  }
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let cells = [], order = [], shown = 0;
  function showPlaceholder(card) {
    const r = rng(card.ct[0] * 65536 + card.ct[1] * 256 + card.ct[2]);
    const n = Math.min(card.ct.length - 16, 220);
    let html = '', i = 0;
    while (i < n) {
      const w = Math.min(n - i, 2 + Math.floor(r() * 6));
      html += '<span class="word">';
      for (let k = 0; k < w; k++, i++) html += `<span class="cell ph">${glyph(card.ct[i] * 131 + i)}<span class="ch">n</span></span>`;
      html += '</span> ';
    }
    $('glyphs').innerHTML = html;
    cells = []; order = []; shown = 0;
  }
  function showMessage(message) {
    let html = '', idx = 0;
    for (const w of message.split(/(\s+)/)) {
      if (!w) continue;
      if (/^\s+$/.test(w)) { html += w.includes('\n') ? '<br>' : ' '; continue; }
      html += '<span class="word">';
      for (const ch of Array.from(w)) { html += `<span class="cell">${glyph(ch.codePointAt(0) * 31 + idx)}<span class="ch">${esc(ch)}</span></span>`; idx++; }
      html += '</span>';
    }
    $('glyphs').innerHTML = html;
    cells = Array.from($('glyphs').querySelectorAll('.cell'));
    order = cells.map((_, i) => i);
    const r = rng(cells.length * 7919 + 13);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    shown = 0;
  }
  function resolveTo(fraction) {
    const target = Math.floor(clamp(fraction) * cells.length + 0.0001);
    while (shown < target) { cells[order[shown]].classList.add('on'); shown++; }
  }

  /* ---------- the scene (3D, see scene.js) ---------- */
  const canvas = $('scene');
  const S = { open: 0, target: 0, heat: 0, heatTarget: 0, recoil: 0, auto: false, t: 0 };
  const P = { x: 0, y: 0, active: false, down: false };
  let scene3d = null;
  try { scene3d = createScene(canvas, reduced); } catch (err) { console.warn('3D scene unavailable', err); canvas.style.display = 'none'; }
  const fit = () => { if (scene3d) scene3d.resize(); };

  let last = 0, announcedOpen = false, unlocked = false;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    S.t += dt;
    if (unlocked) {
      if (P.down) S.target = clamp(S.target + dt / 3.4);
      if (S.auto || !scene3d) S.target = clamp(S.target + dt / 2.6);
    }
    S.open += (S.target - S.open) * (reduced ? 1 : Math.min(1, dt * 5));
    S.heat += (S.heatTarget - S.heat) * (reduced ? 1 : Math.min(1, dt * 2.2));
    S.recoil *= Math.exp(-dt * 2.2);
    if (unlocked) {
      resolveTo((S.open - 0.06) / 0.86);
      if (!announcedOpen && S.open > 0.93) { announcedOpen = true; say('status', 's_open'); $('after').hidden = true; }
    }
    if (scene3d) scene3d.render(S, P, dt, unlocked);
    requestAnimationFrame(frame);
  }

  const toLocal = e => {
    const r = canvas.getBoundingClientRect();
    P.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    P.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  canvas.addEventListener('pointermove', e => { toLocal(e); P.active = true; });
  canvas.addEventListener('pointerdown', e => {
    toLocal(e); P.active = true; P.down = true;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    if (!unlocked) say('status', 's_flinch');
  });
  const release = e => { P.down = false; if (e.pointerType !== 'mouse') P.active = false; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => { P.active = false; P.down = false; });

  /* ---------- card state and interface ---------- */
  let card = null, busy = false, isDemo = false, lastSeed = '';
  const hasCrypto = !!(window.crypto && crypto.subtle);

  function loadCard(c, demo) {
    card = c; isDemo = demo; unlocked = false; announcedOpen = false;
    S.target = 0; S.heatTarget = 0; S.auto = false;
    $('question').textContent = c.question;
    $('demo-chip').hidden = !demo;
    $('answer').value = ''; $('answer').disabled = false; $('answer-btn').disabled = false;
    say('answer-note', 'hint', 'note');
    $('after').hidden = true; $('plain').textContent = '';
    say('status', 's_closed');
    showPlaceholder(c);
  }
  async function loadDemo() { loadCard(parseSeed(await seal(t('dm'), t('dq'), t('da'))), true); }

  $('answer-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (!card || busy || unlocked) return;
    const val = $('answer').value;
    if (!val.trim()) { $('answer').focus(); return; }
    busy = true; $('answer-btn').disabled = true;
    try {
      const message = await unseal(card, val);
      unlocked = true; S.heatTarget = 1;
      showMessage(message);
      $('plain').textContent = message;
      $('answer').disabled = true;
      say('answer-note', 'ok', 'note');
      if (reduced) S.target = 1;
      else { $('after').hidden = false; say('status', 's_known'); }
    } catch (_) {
      S.recoil = 1;
      say('answer-note', 'wrong', 'note err');
      say('status', 's_unknown');
      $('answer-btn').disabled = false;
      $('answer').select();
    }
    busy = false;
  });
  $('auto-open').addEventListener('click', () => { S.auto = true; });

  $('plant-form').addEventListener('submit', e => {
    e.preventDefault();
    try {
      const raw = $('seed-in').value.trim();
      loadCard(parseSeed(raw.includes('#') ? raw.slice(raw.indexOf('#') + 1) : raw), false);
      say('plant-note', 'plant_ok', 'note');
      $('plant').open = false; $('answer').focus();
    } catch (_) { say('plant-note', 'plant_err', 'note err'); }
  });

  function setTab(name) {
    for (const k of ['open', 'grow']) { $('tab-' + k).setAttribute('aria-selected', String(k === name)); $('view-' + k).hidden = k !== name; }
  }
  $('tab-open').addEventListener('click', () => setTab('open'));
  $('tab-grow').addEventListener('click', () => setTab('grow'));

  $('grow-form').addEventListener('submit', async e => {
    e.preventDefault();
    const m = $('msg').value.trim(), q = $('q').value.trim(), a = $('a').value;
    if (!m || !q || !norm(a)) return;
    $('grow-btn').disabled = true;
    try {
      lastSeed = await seal(m, q, a);
      $('link-out').value = location.origin + location.pathname + '#' + lastSeed;
      $('result').hidden = false;
      say('copy-note', 'share', 'note');
      say('grow-note', 'note', 'note');
      $('result').scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    } catch (_) { say('grow-note', 'seal_err', 'note err'); }
    $('grow-btn').disabled = false;
  });
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); say('copy-note', 'copied', 'note'); }
    catch (_) { const out = $('link-out'); out.value = text; out.focus(); out.select(); say('copy-note', 'manual', 'note'); }
  }
  $('copy-link').addEventListener('click', () => copy(location.origin + location.pathname + '#' + lastSeed));
  $('copy-seed').addEventListener('click', () => copy(lastSeed));
  $('try').addEventListener('click', () => { try { loadCard(parseSeed(lastSeed), false); setTab('open'); $('answer').focus(); } catch (_) {} });

  $('lang').addEventListener('change', async () => {
    lang = $('lang').value;
    try { localStorage.setItem('xenia-lang', lang); } catch (_) {}
    applyLang();
    if (isDemo && !unlocked && hasCrypto) await loadDemo();
  });

  function plantFromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h.startsWith('XEN1.')) return false;
    try { loadCard(parseSeed(h), false); setTab('open'); return true; } catch (_) { return false; }
  }
  window.addEventListener('hashchange', plantFromHash);

  /* ---------- boot ---------- */
  (async function start() {
    let saved = null;
    try { saved = localStorage.getItem('xenia-lang'); } catch (_) {}
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    lang = L[saved] ? saved : (L[nav] ? nav : 'en');
    applyLang();
    fit();
    requestAnimationFrame(now => { last = now; requestAnimationFrame(frame); });
    if (!hasCrypto) {
      say('answer-note', 'nocrypto', 'note err');
      $('answer-btn').disabled = true; $('grow-btn').disabled = true;
      return;
    }
    if (!plantFromHash()) await loadDemo();
  })();
})();
