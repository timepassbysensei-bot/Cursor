import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ToastProvider } from "./components/ui/Toast";
import { RequireAdmin, RequireAuth, RequireClient, FullScreenLoader } from "./components/guards";
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import Home from "./pages/public/Home";

/**
 * The landing page ships in the main bundle because it is the first paint for
 * almost every visitor. Everything else is split per route so a phone on 4G
 * downloads the studio only if it is actually opened.
 */
const About = lazy(() => import("./pages/public/About"));
const Videos = lazy(() => import("./pages/public/Videos"));
const Gallery = lazy(() => import("./pages/public/Gallery"));
const Sponsor = lazy(() => import("./pages/public/Sponsor"));
const Contact = lazy(() => import("./pages/public/Contact"));
const Chat = lazy(() => import("./pages/public/Chat"));
const Privacy = lazy(() => import("./pages/public/Privacy"));
const Terms = lazy(() => import("./pages/public/Terms"));
const NotFound = lazy(() => import("./pages/public/NotFound"));

const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));

const ClientOverview = lazy(() => import("./pages/client/Overview"));
const ClientMessages = lazy(() => import("./pages/client/Messages"));
const ClientContact = lazy(() => import("./pages/client/ContactArian"));
const ClientSponsor = lazy(() => import("./pages/client/SponsorArian"));
const ClientProfile = lazy(() => import("./pages/client/Profile"));

const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const AdminGallery = lazy(() => import("./pages/admin/Gallery"));
const AdminVideos = lazy(() => import("./pages/admin/Videos"));
const AdminAudio = lazy(() => import("./pages/admin/Audio"));
const AdminMedia = lazy(() => import("./pages/admin/Media"));
const AdminClients = lazy(() => import("./pages/admin/Clients"));
const AdminMessages = lazy(() => import("./pages/admin/Messages"));
const AdminBroadcasts = lazy(() => import("./pages/admin/Broadcasts"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense fallback={<FullScreenLoader />}>
          <Routes>
            {/* ---------------------------------------------------- public */}
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="videos" element={<Videos />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="sponsor" element={<Sponsor />} />
              <Route path="contact" element={<Contact />} />
              <Route path="chat" element={<Chat />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* ------------------------------------------------------ auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/verify-email" element={<VerifyEmail />} />

            {/* Keep the old /auth/* links working for anything already shared. */}
            <Route path="/auth/login" element={<Navigate to="/login" replace />} />
            <Route path="/auth/signup" element={<Navigate to="/signup" replace />} />

            {/* ---------------------------------------------------- client */}
            <Route
              path="/dashboard"
              element={
                <RequireClient>
                  <DashboardLayout area="client" />
                </RequireClient>
              }
            >
              <Route index element={<ClientOverview />} />
              <Route path="messages" element={<ClientMessages />} />
              <Route path="contact" element={<ClientContact />} />
              <Route path="sponsor" element={<ClientSponsor />} />
              <Route path="profile" element={<ClientProfile />} />
            </Route>

            {/* ----------------------------------------------------- admin */}
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <DashboardLayout area="admin" />
                </RequireAdmin>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="gallery" element={<AdminGallery />} />
              <Route path="videos" element={<AdminVideos />} />
              <Route path="audio" element={<AdminAudio />} />
              <Route path="media" element={<AdminMedia />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="broadcasts" element={<AdminBroadcasts />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route
              path="/admin/*"
              element={
                <RequireAuth>
                  <DashboardLayout area="admin" />
                </RequireAuth>
              }
            >
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}
