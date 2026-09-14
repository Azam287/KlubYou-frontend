import { useMemo } from "react";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import { useToast } from "../../../context/ToastContext";
import { memberStats } from "../../../lib/stats";
import ProfileEditor from "./ProfileEditor";
import CoverColorPicker from "./CoverColorPicker";
import PlanToggles from "./PlanToggles";
import PagePreview from "./PagePreview";

export default function MyPagePage() {
  const {
    studio,
    updateStudio,
    coverGradient,
    setCoverGradient,
    coverSwatches,
    pagePlans,
    togglePagePlan,
    studioPlans,
    programmes,
    members,
    everydayLessons,
    membershipFeatures,
    bundles,
  } = useAppData();
  const { showToast } = useToast();
  usePageHeader("My page", `Design what students see at klubyou.co/${studio.handle}.`);

  // The public page advertises the real active-member count rather than a
  // hardcoded figure that drifts as members come and go.
  const memberCount = useMemo(() => memberStats(members).active, [members]);

  return (
    <section className="panel">
      <div className="page-wrap">
        <div className="cardbox editor">
          <ProfileEditor studio={studio} onChange={updateStudio} />
          <CoverColorPicker swatches={coverSwatches} active={coverGradient} onPick={setCoverGradient} />
          <PlanToggles plans={pagePlans} onToggle={togglePagePlan} />
          <button className="btn btn-coral btn-block" style={{ marginTop: 18 }} onClick={() => showToast("Page published")}>
            Publish changes
          </button>
        </div>

        <PagePreview
          studio={studio}
          coverGradient={coverGradient}
          pagePlans={pagePlans}
          studioPlans={studioPlans}
          programmes={programmes}
          everydayLessons={everydayLessons}
          membershipFeatures={membershipFeatures}
          bundles={bundles}
          memberCount={memberCount}
        />
      </div>
    </section>
  );
}
