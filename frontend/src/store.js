import { create } from "zustand";
import axios from "axios";

// const api = axios.create({ baseURL: '/api' });
const api = axios.create({ baseURL: "https://wealthier-ft.onrender.com/api" });

// Add JWT to all requests
api.interceptors.request.use((cfg) => {
  const token = useStore.getState().jwtToken;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const useStore = create((set, get) => ({
  // Auth
  jwtToken: null,
  clientId: null,
  userProfile: null,
  isAuthenticated: false,

  // Portfolio data
  holdings: [],
  recentOrders: [],

  // User inputs
  userInputs: {},

  // Allocation result
  allocationResult: null,
  isCalculating: false,

  // Market pulse
  marketPulse: null,

  // UI
  currentStep: "login", // login | profile | quiz | dashboard
  quizAnswers: [],

  // ─── AUTH ───────────────────────────────────────────────────────────

  login: async (clientId, password, totp) => {
    const res = await api.post("/smartapi/login", { clientId, password, totp });
    const { jwtToken, feedToken } = res.data;
    set({ jwtToken, clientId, isAuthenticated: true });

    // Auto-fetch profile & holdings
    const [profile, holdings, orders] = await Promise.all([
      api
        .get("/smartapi/profile")
        .then((r) => r.data)
        .catch(() => null),
      api
        .get("/smartapi/holdings")
        .then((r) => r.data)
        .catch(() => []),
      api
        .get("/smartapi/orders")
        .then((r) => r.data)
        .catch(() => []),
    ]);

    set({
      userProfile: profile,
      holdings,
      recentOrders: orders,
      currentStep: "profile",
    });
    return { success: true, profile };
  },

  logout: () =>
    set({
      jwtToken: null,
      clientId: null,
      userProfile: null,
      isAuthenticated: false,
      holdings: [],
      recentOrders: [],
      allocationResult: null,
      currentStep: "login",
      quizAnswers: [],
    }),

  // ─── INPUTS ─────────────────────────────────────────────────────────

  setUserInputs: (inputs) => set({ userInputs: inputs }),

  setQuizAnswers: (answers) => set({ quizAnswers: answers }),

  // ─── ALLOCATION ─────────────────────────────────────────────────────

  runAllocation: async () => {
    const { userInputs, quizAnswers, holdings, recentOrders } = get();
    set({ isCalculating: true });

    try {
      const res = await api.post("/allocation/run", {
        ...userInputs,
        psychometricAnswers: quizAnswers,
        existingHoldings: holdings,
        recentOrders,
      });
      set({
        allocationResult: res.data,
        currentStep: "dashboard",
        isCalculating: false,
      });
      return res.data;
    } catch (err) {
      set({ isCalculating: false });
      throw err;
    }
  },

  // ─── MARKET PULSE ────────────────────────────────────────────────────

  fetchMarketPulse: async () => {
    try {
      const res = await api.get("/market/pulse");
      set({ marketPulse: res.data });
    } catch (e) {}
  },

  // ─── LIVE QUOTES ────────────────────────────────────────────────────

  fetchLiveQuotes: async (tokens) => {
    try {
      const res = await api.post("/smartapi/quotes", { tokens });
      return res.data;
    } catch (e) {
      return [];
    }
  },

  // ─── WHAT-IF ─────────────────────────────────────────────────────────

  runWhatIf: async (params) => {
    const res = await api.post("/allocation/whatif", params);
    return res.data;
  },

  goToStep: (step) => set({ currentStep: step }),
}));

export default api;
