import { Navigate, Route, HashRouter, Routes } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { OnboardingProvider } from "./context/OnboardingContext";
import { AppDataProvider } from "./context/AppDataContext";

import OnboardingLayout from "./components/onboarding/OnboardingLayout";
import AccountStep from "./components/onboarding/AccountStep";
import OtpStep from "./components/onboarding/OtpStep";
import ChannelStep from "./components/onboarding/ChannelStep";
import DoneStep from "./components/onboarding/DoneStep";

import DashboardLayout from "./components/layout/DashboardLayout";
import OverviewPage from "./components/dashboard/overview/OverviewPage";
import MyPagePage from "./components/dashboard/mypage/MyPagePage";
import ProgrammesListPage from "./components/dashboard/programmes/ProgrammesListPage";
import ProgrammeDetailPage from "./components/dashboard/programmes/ProgrammeDetailPage";
import MembersPage from "./components/dashboard/members/MembersPage";
import PaymentsPage from "./components/dashboard/payments/PaymentsPage";
import ClassesPage from "./components/dashboard/classes/ClassesPage";
import SchedulePage from "./components/dashboard/schedule/SchedulePage";
import MembershipPage from "./components/dashboard/membership/MembershipPage";

export default function App() {
  return (
    <ToastProvider>
      <OnboardingProvider>
        <AppDataProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/onboarding/account" replace />} />

              <Route path="/onboarding" element={<OnboardingLayout />}>
                <Route index element={<Navigate to="account" replace />} />
                <Route path="account" element={<AccountStep />} />
                <Route path="otp" element={<OtpStep />} />
                <Route path="channel" element={<ChannelStep />} />
                <Route path="done" element={<DoneStep />} />
              </Route>

              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="page" element={<MyPagePage />} />
                <Route path="programmes" element={<ProgrammesListPage />} />
                <Route path="programmes/:id" element={<ProgrammeDetailPage />} />
                <Route path="members" element={<MembersPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="classes" element={<ClassesPage />} />
                <Route path="schedule" element={<SchedulePage />} />
                <Route path="membership" element={<MembershipPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </AppDataProvider>
      </OnboardingProvider>
    </ToastProvider>
  );
}
