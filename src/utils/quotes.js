// ============================================================
// Quotes, Easter Eggs & Gamification Lines
// ============================================================
// These power every piece of personality in the app.
// Organised by context so components can import exactly what they need.

/** Large faded background text for empty states (charts / calendars) */
export const EMPTY_STATE_QUOTES = [
  "كفاية تخاذل",
  "اعمل حاجة مفيدة في حياتك",
];

/** Tooltip shown on empty weekend cells in the calendar */
export const WEEKEND_EMPTY_TOOLTIP = "you want to be normal??";

/**
 * Toast messages shown after submitting a daily report.
 * Chosen based on the number of hours studied.
 */
export const SUCCESS_TOASTS = {
  low: [
    "حاولت اعمل حاجة صح",
  ],
  high: [
    "yeaaaah buddddy",
    "5 more",
  ],
};

/**
 * Returns the right success toast depending on hours studied.
 * @param {number} hours
 * @returns {string}
 */
export const getSuccessToast = (hours) => {
  if (hours < 3) {
    return SUCCESS_TOASTS.low[Math.floor(Math.random() * SUCCESS_TOASTS.low.length)];
  }
  return SUCCESS_TOASTS.high[Math.floor(Math.random() * SUCCESS_TOASTS.high.length)];
};

/** Tiny rotated footer spy text */
export const FOOTER_SPY_TEXT = "شايفك";

/** Validation error when report text is empty or hours are 0 */
export const VALIDATION_ERROR = "الدولي معادش يستر خلاص";

/** Rage-click modal text (3+ clicks on submit while loading) */
export const RAGE_CLICK_TEXT = "غععع";

/** Random chaos phrases to pop up unpredictably */
export const CHAOS_QUOTES = [
  "الدولي معادش يستر خلاص",
  "انت بتعمل ايه بحياتك؟",
  "الديدلاين بيقرب وانت بتلعب",
  "شايفك بتضيع وقتك",
  "مش كفاية كسل بقى؟",
  "عمرك ما هتنجح لو فضلت كدا",
  "ركز ياض!",
  "روح ذاكر يا فاشل",
];

/**
 * Returns a random empty-state quote.
 * @returns {string}
 */
export const getRandomEmptyQuote = () =>
  EMPTY_STATE_QUOTES[Math.floor(Math.random() * EMPTY_STATE_QUOTES.length)];

/** Random chaos quotes */
export const getRandomChaosQuote = () =>
  CHAOS_QUOTES[Math.floor(Math.random() * CHAOS_QUOTES.length)];

/** Sidebar memes for the Side Pop Bar */
export const SIDEBAR_MEMES = [
  "لو مكسل تذاكر، افتكر ان في واحد فاشل قاعد مستنيك تفشل زيه",
  "اليوم هيخلص وانت لسه مبدأتش",
  "القهوة مش هتنفعك يوم النتيجة",
  "نام وارتاح، والامتياز هيروح للي صاحي بيكافح",
  "🟢 = راجل بطل\n🔴 = متخاذل\n📝 = بيتحجج\n🚩 = ديدلاين\nالخيار ليك",
];

export const getRandomSidebarMeme = () =>
  SIDEBAR_MEMES[Math.floor(Math.random() * SIDEBAR_MEMES.length)];

/** Responses when someone submits an excuse */
export const EXCUSE_MOCKS = [
  "يا عيني يا بني، عذر أقبح من ذنب والله",
  "طب صدقتك أنا كدا؟ روح ذاكر يا فاشل",
  "الأعذار دي متمشيش معانا، لونك لسه أحمر يا متخاذل",
  "يا حرام صعبت عليا... انزل ضغط بقى!",
  "أعذار الضعفاء، مفيش رحمة هنا",
];

export const getRandomExcuseMock = () =>
  EXCUSE_MOCKS[Math.floor(Math.random() * EXCUSE_MOCKS.length)];
