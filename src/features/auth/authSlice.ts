import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { apiFetch } from "@/lib/api";

type AuthUser = {
  id: string;
  email: string;
  phone: string | null;
  fullName: string;
  isVerified: boolean;
  role: "donor" | "org_admin" | "platform_admin";
  status: "active" | "suspended";
  avatarUrl?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  pendingVerificationEmail: string | null;
  pendingVerificationPhone: string | null;
  loading: boolean;
  hydrated: boolean;
  forgotPasswordSent: boolean;
  error: string | null;
};

const emptyState = (): AuthState => ({
  user: null,
  pendingVerificationEmail: null,
  pendingVerificationPhone: null,
  loading: false,
  hydrated: false,
  forgotPasswordSent: false,
  error: null,
});

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

export const resendOtp = createAsyncThunk(
  "auth/resendOtp",
  async (payload: { email: string }) =>
    apiFetch<SignupResponse>("/auth/resend-otp", {
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

export const adminLogin = createAsyncThunk(
  "auth/adminLogin",
  async (payload: LoginPayload) =>
    apiFetch<AuthResponse>("/auth/admin/login", {
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

export const googleAuth = createAsyncThunk(
  "auth/googleAuth",
  async (payload: { idToken: string }) =>
    apiFetch<AuthResponse>("/auth/google", {
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

export const fetchSession = createAsyncThunk("auth/fetchSession", async () =>
  apiFetch<AuthResponse>("/auth/session"),
);

export const logout = createAsyncThunk("auth/logout", async () =>
  apiFetch<MessageResponse>("/auth/logout", {
    method: "POST",
  }),
);

const authSlice = createSlice({
  name: "auth",
  initialState: emptyState(),
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
    clearSessionState(state) {
      state.user = null;
      state.pendingVerificationEmail = null;
      state.pendingVerificationPhone = null;
      state.forgotPasswordSent = false;
      state.error = null;
      state.hydrated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSession.pending, (state) => {
        state.hydrated = false;
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.hydrated = true;
        state.error = null;
      })
      .addCase(fetchSession.rejected, (state) => {
        state.user = null;
        state.hydrated = true;
      })
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
        state.user = action.payload.user;
        state.hydrated = true;
        state.pendingVerificationEmail = null;
        state.pendingVerificationPhone = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Verification failed";
      })
      .addCase(resendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingVerificationEmail = action.payload.email;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Resend failed";
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.hydrated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Login failed";
      })
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.hydrated = true;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Admin login failed";
      })
      .addCase(googleAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.hydrated = true;
      })
      .addCase(googleAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Google sign-in failed";
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
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.pendingVerificationEmail = null;
        state.pendingVerificationPhone = null;
        state.forgotPasswordSent = false;
        state.error = null;
        state.hydrated = true;
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.pendingVerificationEmail = null;
        state.pendingVerificationPhone = null;
        state.forgotPasswordSent = false;
        state.error = null;
        state.hydrated = true;
      });
  },
});

export const {
  clearAuthError,
  setPendingVerificationEmail,
  clearPendingVerification,
  clearSessionState,
} = authSlice.actions;
export const authReducer = authSlice.reducer;
