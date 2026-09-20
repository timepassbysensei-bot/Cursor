import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import { RequireRole } from "./components/guards";
import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Courses from "./pages/public/Courses";
import CourseDetail from "./pages/public/CourseDetail";
import Admissions from "./pages/public/Admissions";
import Results from "./pages/public/Results";
import Gallery from "./pages/public/Gallery";
import Notices from "./pages/public/Notices";
import Resources from "./pages/public/Resources";
import Contact from "./pages/public/Contact";
import Privacy from "./pages/public/Privacy";
import Terms from "./pages/public/Terms";
import RefundPolicy from "./pages/public/RefundPolicy";
import NotFound from "./pages/public/NotFound";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ChangePassword from "./pages/auth/ChangePassword";
import AdminOverview from "./pages/admin/Overview";
import AdminCourses from "./pages/admin/Courses";
import AdminBatches from "./pages/admin/Batches";
import AdminStudents from "./pages/admin/Students";
import AdminTeachers from "./pages/admin/Teachers";
import AdminInquiries from "./pages/admin/Inquiries";
import AdminNotices from "./pages/admin/Notices";
import AdminAchievements from "./pages/admin/Achievements";
import AdminTestimonials from "./pages/admin/Testimonials";
import AdminGallery from "./pages/admin/Gallery";
import AdminFaqs from "./pages/admin/Faqs";
import AdminSiteContent from "./pages/admin/SiteContent";
import AdminSiteSettings from "./pages/admin/SiteSettings";
import AdminAuditLogs from "./pages/admin/AuditLogs";
import TeacherOverview from "./pages/teacher/Overview";
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherTests from "./pages/teacher/Tests";
import TeacherMarksEntry from "./pages/teacher/MarksEntry";
import TeacherAssignments from "./pages/teacher/Assignments";
import TeacherResources from "./pages/teacher/Resources";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAssignments from "./pages/student/Assignments";
import StudentResources from "./pages/student/Resources";
import StudentResults from "./pages/student/Results";
import StudentAttendance from "./pages/student/Attendance";
import StudentMessages from "./pages/student/Messages";
import StudentProfile from "./pages/student/Profile";

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-offwhite" role="status">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy/20 border-t-navy" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:slug" element={<CourseDetail />} />
          <Route path="admissions" element={<Admissions />} />
          <Route path="results" element={<Results />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="notices" element={<Notices />} />
          <Route path="resources" element={<Resources />} />
          <Route path="contact" element={<Contact />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="refund-policy" element={<RefundPolicy />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/auth">
          <Route path="login" element={<Login />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireRole roles={["super_admin", "admin"]}>
              <DashboardLayout area="admin" />
            </RequireRole>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="batches" element={<AdminBatches />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="teachers" element={<AdminTeachers />} />
          <Route path="inquiries" element={<AdminInquiries />} />
          <Route path="notices" element={<AdminNotices />} />
          <Route path="achievements" element={<AdminAchievements />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="faqs" element={<AdminFaqs />} />
          <Route path="site-content" element={<AdminSiteContent />} />
          <Route path="site-settings" element={<AdminSiteSettings />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
        </Route>

        <Route
          path="/teacher"
          element={
            <RequireRole roles={["teacher"]}>
              <DashboardLayout area="teacher" />
            </RequireRole>
          }
        >
          <Route index element={<TeacherOverview />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="tests" element={<TeacherTests />} />
          <Route path="tests/:testId/marks" element={<TeacherMarksEntry />} />
          <Route path="assignments" element={<TeacherAssignments />} />
          <Route path="resources" element={<TeacherResources />} />
        </Route>

        <Route
          path="/student"
          element={
            <RequireRole roles={["student"]}>
              <DashboardLayout area="student" />
            </RequireRole>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="resources" element={<StudentResources />} />
          <Route path="results" element={<StudentResults />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="messages" element={<StudentMessages />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export { FullScreenSpinner };
