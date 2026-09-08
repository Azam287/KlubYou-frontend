import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import { useToast } from "../../../context/ToastContext";
import ProfileEditor from "./ProfileEditor";
import CoverColorPicker from "./CoverColorPicker";
import PlanToggles from "./PlanToggles";
import PagePreview from "./PagePreview";

export default function MyPagePage() {
  const { studio, updateStudio, coverGradient, setCoverGradient, coverSwatches, pagePlans, togglePagePlan, programmes } =
    useAppData();
  const { showToast } = useToast();
  usePageHeader("My page", `Design what students see at klubyou.co/${studio.handle}.`);

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
          primaryProgramme={programmes[0]}
        />
      </div>
    </section>
  );
}
