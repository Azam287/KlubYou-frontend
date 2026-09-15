import { useMemo, useState } from "react";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import { useToast } from "../../../context/ToastContext";
import Icon from "../../common/Icon";
import {
  PAGE_SECTIONS,
  PREVIEW_DEVICES,
  pagePlans,
  pageProgrammes,
  publishedProgrammes,
  isSectionHidden,
  pageChanged,
  sectionOrderOf,
  sectionSummary,
  themeOf,
} from "../../../lib/page";
import ProfileEditor from "./ProfileEditor";
import LinksEditor from "./LinksEditor";
import ColourEditor from "./ColourEditor";
import PageContents from "./PageContents";
import ProgrammePicker from "./ProgrammePicker";
import AboutEditor from "./AboutEditor";
import IntroVideoEditor from "./IntroVideoEditor";
import EditorTiles from "./EditorTiles";
import PagePreview from "./PagePreview";

// The creator's public page: edit on the left, see it on the right.
//
// Edits are a draft: the preview shows them straight away, and "Publish changes"
// appears in the header to put them live. What the page sells is published on
// the Membership and Programmes pages, not here.
// `defaultEditorOpen` exists so the collapsed layout can be rendered directly
// (tests have no clicks); the page itself always opens with the editor showing.
export default function MyPagePage({ defaultEditorOpen = true }) {
  const {
    studio,
    updateStudio,
    addPageLink,
    updatePageLink,
    removePageLink,
    updatePageTheme,
    setProgrammeOnPage,
    showAllProgrammes,
    movePageSection,
    setSectionHidden,
    publishedPage,
    publishPage,
    studioPlans,
    programmes,
    everydayLessons,
    bundles,
    membershipFeatures,
  } = useAppData();
  const { showToast } = useToast();
  // Which frame the preview is drawn in. Only a way of looking — nothing about
  // the page changes.
  const [device, setDevice] = useState("phone");
  // Hiding the editor gives the preview the whole width — for looking at the
  // page, especially in the web view, once the editing is done.
  const [editorOpen, setEditorOpen] = useState(defaultEditorOpen);

  const pageUrl = `klubyou.co/${studio.handle}`;
  // Edits here are a draft until published. The button only exists when there's
  // something to publish, so its presence is the "you have changes" signal.
  const changed = pageChanged(studio, publishedPage);
  const headerActions = useMemo(
    () => (
      <div className="hdr-actions">
        <button
          className="btn btn-ghost"
          data-tip="Copy your page's address to share it"
          data-tip-side="bottom"
          onClick={async () => {
            // Only claim it's copied once it has been. The clipboard can be
            // missing or refused (it's a promise, so a try around the call alone
            // never saw the refusal) — then the toast gives the address instead.
            try {
              await navigator.clipboard.writeText(`https://${pageUrl}`);
              showToast(`Copied ${pageUrl}`);
            } catch {
              showToast(`Couldn't copy — your page is ${pageUrl}`);
            }
          }}
        >
          <Icon name="copy" size={15} strokeWidth={2} /> Copy page link
        </button>
        {changed && (
          <button
            className="btn btn-coral"
            data-tip="Put your changes live — until then, visitors see the last published version"
            data-tip-side="bottom"
            onClick={publishPage}
          >
            <Icon name="check" size={15} strokeWidth={2.4} /> Publish changes
          </button>
        )}
      </div>
    ),
    [pageUrl, showToast, changed, publishPage]
  );
  usePageHeader(
    "My page",
    changed
      ? "You have unpublished changes — visitors still see the last published page."
      : "Everything is published. Changes stay private until you publish them.",
    headerActions
  );

  const plans = useMemo(() => pagePlans(studioPlans), [studioPlans]);
  const published = useMemo(() => publishedProgrammes(programmes), [programmes]);
  const sellable = useMemo(
    () => pageProgrammes(programmes, studio.hiddenProgrammes),
    [programmes, studio.hiddenProgrammes]
  );

  const order = sectionOrderOf(studio);
  const summaryData = { studio, plans, published };
  const theme = themeOf(studio);

  // What each section tile holds. The tiles are listed in the page's own order,
  // so moving one here moves it on the page.
  const bodies = {
    about: <AboutEditor value={studio.about} onChange={(about) => updateStudio({ about })} />,
    video: (
      <IntroVideoEditor
        value={studio.introVideo}
        onChange={(introVideo) => updateStudio({ introVideo })}
      />
    ),
    links: (
      <LinksEditor
        links={studio.links}
        onAdd={addPageLink}
        onChange={updatePageLink}
        onRemove={removePageLink}
      />
    ),
    memberships: <PageContents plans={plans} />,
    programmes: (
      <ProgrammePicker
        published={published}
        hidden={studio.hiddenProgrammes || []}
        drafts={programmes.length - published.length}
        onToggle={setProgrammeOnPage}
        onShowAll={showAllProgrammes}
      />
    ),
  };
  const tiles = [
    ...order.map((key) => ({
      key,
      title: PAGE_SECTIONS.find((sec) => sec.key === key).label,
      summary: sectionSummary(key, summaryData),
      body: bodies[key],
      movable: true,
      hidden: isSectionHidden(studio, key),
      onHide: (hidden) => setSectionHidden(key, hidden),
    })),
    // Colours style the whole page rather than sitting somewhere on it, so the
    // tile closes like the rest but stays at the bottom.
    {
      key: "colours",
      title: "Colours",
      summary: (
        <span className="tile-dots" aria-label="Background, text and accent">
          {[theme.background, theme.text, theme.accent].map((c, i) => (
            <i key={i} style={{ background: c }} />
          ))}
        </span>
      ),
      body: <ColourEditor theme={theme} onChange={updatePageTheme} />,
      movable: false,
    },
  ];

  return (
    // `mypage` fits this page to the window: the editor scrolls inside its own
    // column rather than the whole page scrolling under the header.
    <section className="panel mypage">
      <div className={`page-wrap${editorOpen ? "" : " solo"}`}>
        {/* The editor column, with its collapse arrow pinned to the right edge.
            Collapsed, the column is empty but keeps the arrow where it was. */}
        <div className={`ed-col${editorOpen ? "" : " closed"}`}>
          {/* Kept mounted while hidden, so open tiles and messages are where you
              left them when it comes back. */}
          <div className="cardbox editor" id="mypage-editor" hidden={!editorOpen}>
            <ProfileEditor studio={studio} onChange={updateStudio} />
            <div className="eg">
              <h4>Page sections</h4>
              <p className="hint tiles-hint">Drag to change the order they appear on your page.</p>
              <EditorTiles tiles={tiles} onMove={movePageSection} />
            </div>
          </div>

          <div className="ed-track">
            <button
              className="ed-handle"
              aria-label={editorOpen ? "Hide editor" : "Show editor"}
              aria-expanded={editorOpen}
              aria-controls="mypage-editor"
              data-tip={editorOpen ? "Hide the editor and give the preview the full width" : "Bring the editor back"}
              data-tip-side="right"
              onClick={() => setEditorOpen((open) => !open)}
            >
              <Icon name={editorOpen ? "chevronLeft" : "chevronRight"} size={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        <div className="pv-col">
          {/* <span className="pv-lbl">Preview</span> */}
          <div className="pv-bar">
            
            <div className="viewpick" role="group" aria-label="Preview on">
              {PREVIEW_DEVICES.map((d) => (
                <button
                  key={d.key}
                  className={`viewbtn pv-btn${device === d.key ? " on" : ""}`}
                  aria-pressed={device === d.key}
                  data-tip={
                    d.key === "phone"
                      ? "How it looks opened from a link in bio"
                      : "How it looks on a computer"
                  }
                  onClick={() => setDevice(d.key)}
                >
                  <Icon name={d.icon} size={15} strokeWidth={1.9} /> {d.label}
                </button>
              ))}
            </div>
          </div>

          <PagePreview
            studio={studio}
            plans={plans}
            programmes={sellable}
            catalogue={published}
            bundles={bundles}
            lessons={everydayLessons}
            features={membershipFeatures}
            device={device}
          />
        </div>
      </div>
    </section>
  );
}
