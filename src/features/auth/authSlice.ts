import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { apiFetch } from "@/lib/api";

type AuthUser = {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  isVerified: boolean;
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  pendingVerificationEmail: string | null;
  pendingVerificationPhone: string | null;
  loading: boolean;
  forgotPasswordSent: boolean;
  error: string | null;
};

const AUTH_STORAGE_KEY = "azarfaith-auth";

const emptyState = (): AuthState => ({
  accessToken: null,
  user: null,
  pendingVerificationEmail: null,
  pendingVerificationPhone: null,
  loading: false,
  forgotPasswordSent: false,
  error: null,
});

const getInitialState = (): AuthState => {
  if (typeof window === "undefined") return emptyState();

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return emptyState();

  try {
    const parsed = JSON.parse(raw) as Pick<AuthState, "accessToken" | "user">;
    return {
      ...emptyState(),
      accessToken: parsed.accessToken ?? null,
      user: parsed.user ?? null,
    };
  } catch {
    return emptyState();
  }
};

const persistAuth = (state: Pick<AuthState, "accessToken" | "user">) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
};

type SignupPayload = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

type VerifyOtpPayload = {
  email: string;
  code: string;
};

type LoginPayload = {
  identifier: string;
  password: string;
};

type ForgotPasswordPayload = {
  email: string;
};

type ResetPasswordPayload = {
  token: string;
  password: string;
};

type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

type SignupResponse = {
  message: string;
  email: string;
};

type MessageResponse = {
  message: string;
};

export const signup = createAsyncThunk("auth/signup", async (payload: SignupPayload) =>
  apiFetch<SignupResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
);

export const verifyOtp = createAsyncThunk("auth/verifyOtp", async (payload: VerifyOtpPayload) =>
  apiFetch<AuthResponse>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
);

export const login = createAsyncThunk("auth/login", async (payload: LoginPayload) =>
  apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (payload: ForgotPasswordPayload) =>
    apiFetch<MessageResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (payload: ResetPasswordPayload) =>
    apiFetch<MessageResponse>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
);

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    setPendingVerificationEmail(state, action: PayloadAction<string>) {
      state.pendingVerificationEmail = action.payload;
      state.pendingVerificationPhone = null;
      state.error = null;
    },
    clearPendingVerification(state) {
      state.pendingVerificationEmail = null;
      state.pendingVerificationPhone = null;
    },
    logout(state) {
      state.accessToken = null;
      state.user = null;
      state.pendingVerificationEmail = null;
      state.pendingVerificationPhone = null;
      state.forgotPasswordSent = false;
      state.error = null;
      persistAuth({ accessToken: null, user: null });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingVerificationEmail = action.payload.email;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Signup failed";
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.pendingVerificationEmail = null;
        state.pendingVerificationPhone = null;
        persistAuth({
          accessToken: action.payload.accessToken,
          user: action.payload.user,
        });
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Verification failed";
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        persistAuth({
          accessToken: action.payload.accessToken,
          user: action.payload.user,
        });
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Login failed";
      })
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.forgotPasswordSent = false;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.forgotPasswordSent = true;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Request failed";
      })
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Password reset failed";
      });
  },
});

export const {
  clearAuthError,
  setPendingVerificationEmail,
  clearPendingVerification,
  logout,
} = authSlice.actions;
export const authReducer = authSlice.reducer;
