# Graph Report - .  (2026-09-13)

## Corpus Check
- Corpus is ~9,578 words - fits in a single context window. You may not need a graph.

## Summary
- 172 nodes · 366 edges · 12 communities
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.82)
- Token cost: 40,010 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Build Dependency Manifest|Build Dependency Manifest]]
- [[_COMMUNITY_Onboarding Signup Flow|Onboarding Signup Flow]]
- [[_COMMUNITY_Members & Payments Tables|Members & Payments Tables]]
- [[_COMMUNITY_Programmes & Classes Browsing|Programmes & Classes Browsing]]
- [[_COMMUNITY_Modal Dialog Forms|Modal Dialog Forms]]
- [[_COMMUNITY_Mock Data Store|Mock Data Store]]
- [[_COMMUNITY_Creator Page Editor|Creator Page Editor]]
- [[_COMMUNITY_Dashboard Overview Charts|Dashboard Overview Charts]]
- [[_COMMUNITY_Dashboard Layout Navigation|Dashboard Layout Navigation]]
- [[_COMMUNITY_App Shell & Branding|App Shell & Branding]]

## God Nodes (most connected - your core abstractions)
1. `useAppData()` - 23 edges
2. `usePageHeader()` - 16 edges
3. `Icon()` - 15 edges
4. `useOnboarding()` - 11 edges
5. `KlubYou Creator Dashboard (HTML shell)` - 8 edges
6. `Modal()` - 7 edges
7. `useToast()` - 7 edges
8. `scripts` - 5 edges
9. `MyPagePage()` - 5 edges
10. `ProgrammeDetailPage()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `KlubYou Frontend (project)` --conceptually_related_to--> `KlubYou Creator Dashboard (HTML shell)`  [INFERRED]
  README.md → index.html
- `KlubYou Frontend (project)` --conceptually_related_to--> `Creator Dashboard product surface`  [INFERRED]
  README.md → index.html
- `ClassesPage()` --calls--> `useAppData()`  [EXTRACTED]
  src/components/dashboard/classes/ClassesPage.jsx → src/context/AppDataContext.jsx
- `MembersPage()` --calls--> `usePageHeader()`  [EXTRACTED]
  src/components/dashboard/members/MembersPage.jsx → src/context/PageHeaderContext.jsx
- `MyPagePage()` --calls--> `useAppData()`  [EXTRACTED]
  src/components/dashboard/mypage/MyPagePage.jsx → src/context/AppDataContext.jsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Client-side render bootstrap flow (shell to mount to module entry)** — index_klubyou_creator_dashboard, index_root, index_src_main_jsx_entry, index_spa_bootstrap_pattern [INFERRED 0.85]
- **Brand presentation layer declared in the HTML shell** — index_inline_svg_favicon, index_google_fonts_typography, index_creator_dashboard_product, index_mobile_responsive_viewport [INFERRED 0.75]

## Communities (12 total, 0 thin omitted)

### Community 0 - "Build Dependency Manifest"
Cohesion: 0.08
Nodes (23): dependencies, react, react-dom, react-router-dom, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+15 more)

### Community 1 - "Onboarding Signup Flow"
Cohesion: 0.17
Nodes (15): App(), GoogleIcon(), LogoMark(), QrPlaceholder(), AccountStep(), ChannelStep(), DoneStep(), OnboardingLayout() (+7 more)

### Community 2 - "Members & Payments Tables"
Cohesion: 0.16
Nodes (13): KebabMenu(), MemberFilters(), STATUS_CHIPS, MemberRow(), STATUS_PILL, MembersPage(), MemberTable(), PaymentsPage() (+5 more)

### Community 3 - "Programmes & Classes Browsing"
Cohesion: 0.22
Nodes (11): Icon(), PATHS, ClassesPage(), LiveClassCard(), MODE, emptyForm, NewProgrammeModal(), ProgrammeCard() (+3 more)

### Community 4 - "Modal Dialog Forms"
Cohesion: 0.22
Nodes (10): Modal(), AddPlanModal(), LENGTHS, DeleteClassModal(), TimingModal(), TYPE_LABEL, ClassFormModal(), emptyForm (+2 more)

### Community 5 - "Mock Data Store"
Cohesion: 0.20
Nodes (13): AppDataContext, coverSwatches, initialActivity, initialLiveClasses, initialMembers, initialPagePlans, initialPayments, initialProgrammes (+5 more)

### Community 6 - "Creator Page Editor"
Cohesion: 0.17
Nodes (10): CoverColorPicker(), MyPagePage(), PagePreview(), PlanToggles(), ProfileEditor(), ProgrammeDetailPage(), AppDataProvider(), ToastContext (+2 more)

### Community 7 - "Dashboard Overview Charts"
Cohesion: 0.21
Nodes (8): ActivityFeed(), ICON_NAME, ICON_STYLE, EarningsChart(), OverviewPage(), PlanMixChart(), StatCard(), earningsSeries

### Community 8 - "Dashboard Layout Navigation"
Cohesion: 0.27
Nodes (8): DashboardLayout(), NAV_ITEMS, Sidebar(), Topbar(), PageHeaderContext, PageHeaderProvider(), useHeader(), usePageHeaderContext()

### Community 9 - "App Shell & Branding"
Cohesion: 0.39
Nodes (9): Creator Dashboard product surface, Google Fonts typography stack (Bricolage Grotesque + Hanken Grotesk), Inline data-URI SVG favicon (play glyph), KlubYou Creator Dashboard (HTML shell), Mobile-responsive viewport declaration, #root mount element, Single-page app bootstrap via ES module entry, /src/main.jsx module entry (+1 more)

## Knowledge Gaps
- **42 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+37 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAppData()` connect `Members & Payments Tables` to `Onboarding Signup Flow`, `Programmes & Classes Browsing`, `Modal Dialog Forms`, `Mock Data Store`, `Creator Page Editor`, `Dashboard Overview Charts`, `Dashboard Layout Navigation`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `Icon()` connect `Programmes & Classes Browsing` to `Onboarding Signup Flow`, `Members & Payments Tables`, `Modal Dialog Forms`, `Creator Page Editor`, `Dashboard Overview Charts`, `Dashboard Layout Navigation`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `usePageHeader()` connect `Programmes & Classes Browsing` to `Members & Payments Tables`, `Modal Dialog Forms`, `Creator Page Editor`, `Dashboard Overview Charts`, `Dashboard Layout Navigation`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _42 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Build Dependency Manifest` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._