import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  coverSwatches,
  initialEverydayLessons,
  initialBundles,
  initialMembershipFeatures,
  initialMembers,
  initialPayments,
  initialProgrammes,
  initialStudio,
  initialStudioPlans,
} from "../data/mockData";
import { nextMembershipOrder } from "../lib/membership";
import { giftedRenewal, voucherCode } from "../lib/members";
import { renewalAfterPayment } from "../lib/payments";
import { formatDayMonth } from "../lib/datetime";
import { MAX_LINKS, moveItem, pageSnapshot, sectionOrderOf, themeOf } from "../lib/page";
import { useToast } from "./ToastContext";

const AppDataContext = createContext(null);

let idSeq = 1000;
const nextId = (prefix) => `${prefix}-${idSeq++}`;

function detectPlatform(url) {
  const v = (url || "").toLowerCase();
  if (!v) return "none";
  if (v.includes("zoom")) return "zoom";
  if (v.includes("youtu")) return "yt";
  return "zoom";
}

// Every programme mutation narrows to one programme and hands the rest through
// untouched. Class and section actions no longer take a `section` argument:
// a programme has a single content list, decided by its type.
function mapProgramme(list, programmeId, fn) {
  return list.map((p) => (p.id === programmeId ? fn(p) : p));
}

// What a publish toggle did was the one thing the message didn't say, which
// matters most from the table: the row leaves it the moment you unpublish.
const statusToast = (patch, noun) =>
  patch.status === "published"
    ? `${noun} published — members can see it`
    : patch.status === "draft"
      ? `${noun} unpublished — back to drafts`
      : `${noun} updated`;

export function AppDataProvider({ children }) {
  const { showToast } = useToast();

  const [studio, setStudio] = useState(initialStudio);
  // What visitors see. My page edits `studio` as a draft; this only moves when
  // the creator publishes (lib/page.js → pageSnapshot).
  const [publishedPage, setPublishedPage] = useState(() => pageSnapshot(initialStudio));
  const [studioPlans, setStudioPlans] = useState(initialStudioPlans);
  const [membershipFeatures, setMembershipFeatures] = useState(initialMembershipFeatures);
  const [bundles, setBundles] = useState(initialBundles);
  const [members, setMembers] = useState(initialMembers);
  const [programmes, setProgrammes] = useState(initialProgrammes);
  const [payments, setPayments] = useState(initialPayments);
  const [everydayLessons, setEverydayLessons] = useState(initialEverydayLessons);

  /* ---------- profile / page ---------- */
  const updateStudio = useCallback((patch) => {
    setStudio((s) => ({ ...s, ...patch }));
  }, []);

  // The public page's links. Rows are kept while half-typed; the page itself
  // shows only the ones that look like a link (lib/page.js).
  const addPageLink = useCallback(() => {
    setStudio((s) =>
      (s.links || []).length >= MAX_LINKS
        ? s
        : { ...s, links: [...(s.links || []), { id: nextId("link"), label: "", url: "" }] }
    );
  }, []);

  const updatePageLink = useCallback((linkId, patch) => {
    setStudio((s) => ({
      ...s,
      links: (s.links || []).map((l) => (l.id === linkId ? { ...l, ...patch } : l)),
    }));
  }, []);

  const removePageLink = useCallback((linkId) => {
    setStudio((s) => ({ ...s, links: (s.links || []).filter((l) => l.id !== linkId) }));
  }, []);

  const publishPage = useCallback(() => {
    setPublishedPage(pageSnapshot(studio));
    showToast("Page published — visitors now see your changes");
  }, [studio, showToast]);

  // Which published programmes the page shows. Stored as the hidden ones, so
  // anything published later shows up without being ticked.
  const setProgrammeOnPage = useCallback((programmeId, shown) => {
    setStudio((s) => {
      const hidden = (s.hiddenProgrammes || []).filter((id) => id !== programmeId);
      return { ...s, hiddenProgrammes: shown ? hidden : [...hidden, programmeId] };
    });
  }, []);

  // Where a section sits on the page. One move at a time, by drag or by key.
  const movePageSection = useCallback((key, to) => {
    setStudio((s) => ({ ...s, sectionOrder: moveItem(sectionOrderOf(s), key, to) }));
  }, []);

  // Switch a whole section on or off. Its content is kept either way.
  const setSectionHidden = useCallback((key, hidden) => {
    setStudio((s) => {
      const rest = (s.hiddenSections || []).filter((k) => k !== key);
      return { ...s, hiddenSections: hidden ? [...rest, key] : rest };
    });
  }, []);

  const showAllProgrammes = useCallback(() => {
    setStudio((s) => ({ ...s, hiddenProgrammes: [] }));
  }, []);

  // Background and text colour. Everything else on the page is mixed from
  // these two, so a page can't end up with a third colour nobody chose.
  const updatePageTheme = useCallback((patch) => {
    setStudio((s) => ({ ...s, theme: { ...themeOf(s), ...patch } }));
  }, []);


  /* ---------- studio subscription (tier 1: unlocks everything) ---------- */
  const addStudioPlan = useCallback(
    (plan) => {
      // Made as a draft: nothing reaches members until you publish it.
      setStudioPlans((list) => [...list, { id: nextId("splan"), status: "draft", ...plan }]);
      showToast("Plan added as a draft");
    },
    [showToast]
  );

  const updateStudioPlan = useCallback(
    (planId, patch) => {
      setStudioPlans((list) => list.map((p) => (p.id === planId ? { ...p, ...patch } : p)));
      showToast("Plan updated");
    },
    [showToast]
  );

  // Which bundles a plan draws on. Content itself lives on the bundles.
  const setPlanBundles = useCallback((planId, bundleIds) => {
    setStudioPlans((list) =>
      list.map((p) => (p.id === planId ? { ...p, bundles: bundleIds } : p))
    );
  }, []);

  // And which extras it includes — on the plan too, so one record owns
  // everything a plan opens.
  const setPlanExtras = useCallback((planId, extraIds) => {
    setStudioPlans((list) => list.map((p) => (p.id === planId ? { ...p, extras: extraIds } : p)));
  }, []);

  /* ---------- bundles ---------- */
  const addBundle = useCallback(
    (bundle) => {
      const id = nextId("bundle");
      // At the end of the shared sequence, not at position nothing — an
      // order-less row sorts above every numbered one.
      const order = nextMembershipOrder(bundles, membershipFeatures);
      setBundles((list) => [
        ...list,
        { id, status: "draft", order, programmes: [], lessons: [], ...bundle },
      ]);
      showToast("Bundle created as a draft");
      return id;
    },
    [bundles, membershipFeatures, showToast]
  );

  const updateBundle = useCallback(
    (bundleId, patch) => {
      setBundles((list) => list.map((b) => (b.id === bundleId ? { ...b, ...patch } : b)));
      showToast(statusToast(patch, "Bundle"));
    },
    [showToast]
  );

  // Row order is decided in the table, and bundles and extras share one
  // sequence — so moving a row swaps it with whatever is next to it, whichever
  // kind that turns out to be. Positions are renumbered from one afterwards so
  // the sequence can't drift apart.
  const moveMembershipRow = useCallback(
    (id, direction) => {
      const combined = [
        ...bundles.map((b) => ({ id: b.id, kind: "bundle", order: b.order || 0 })),
        ...membershipFeatures.map((f) => ({ id: f.id, kind: "extra", order: f.order || 0 })),
      ].sort((a, b) => a.order - b.order);

      const i = combined.findIndex((r) => r.id === id);
      const j = i + direction;
      if (i < 0 || j < 0 || j >= combined.length) return;
      [combined[i], combined[j]] = [combined[j], combined[i]];

      const next = new Map(combined.map((r, idx) => [r.id, idx + 1]));
      setBundles((list) => list.map((b) => ({ ...b, order: next.get(b.id) ?? b.order })));
      setMembershipFeatures((list) =>
        list.map((f) => ({ ...f, order: next.get(f.id) ?? f.order }))
      );
    },
    [bundles, membershipFeatures]
  );

  const deleteBundle = useCallback(
    (bundleId) => {
      setBundles((list) => list.filter((b) => b.id !== bundleId));
      // A deleted bundle can't go on opening things for a plan.
      setStudioPlans((list) =>
        list.map((p) => ({ ...p, bundles: (p.bundles || []).filter((id) => id !== bundleId) }))
      );
      showToast("Bundle deleted");
    },
    [showToast]
  );

  // Exactly one best seller: two highlights highlight nothing, so marking one
  // clears the rest rather than letting them accumulate.
  const setBestSellerPlan = useCallback(
    (planId) => {
      setStudioPlans((list) =>
        list.map((p) => ({ ...p, bestSeller: p.id === planId && !p.bestSeller }))
      );
    },
    []
  );

  const removeStudioPlan = useCallback(
    (planId) => {
      setStudioPlans((list) => list.filter((p) => p.id !== planId));
      showToast("Plan removed");
    },
    [showToast]
  );

  /* ---------- what the membership includes ---------- */
  const addMembershipFeature = useCallback(
    ({ title, detail }) => {
      // One sequence with the bundles: numbering by how many extras there are
      // put a new one on top of whichever bundle already held that position.
      const order = nextMembershipOrder(bundles, membershipFeatures);
      setMembershipFeatures((list) => [
        ...list,
        {
          id: nextId("feature"),
          status: "draft",
          order,
          title: title || "Untitled",
          detail: detail || "",
        },
      ]);
      showToast("Added as a draft");
    },
    [bundles, membershipFeatures, showToast]
  );

  const updateMembershipFeature = useCallback(
    (featureId, patch) => {
      setMembershipFeatures((list) => list.map((f) => (f.id === featureId ? { ...f, ...patch } : f)));
      showToast(statusToast(patch, "Benefit"));
    },
    [showToast]
  );

  const deleteMembershipFeature = useCallback(
    (featureId) => {
      setMembershipFeatures((list) => list.filter((f) => f.id !== featureId));
      // A deleted extra can't go on being included, the same way a deleted
      // bundle is dropped from the plans that drew on it.
      setStudioPlans((list) =>
        list.map((p) => ({ ...p, extras: (p.extras || []).filter((id) => id !== featureId) }))
      );
      showToast("Removed from the membership");
    },
    [showToast]
  );


  /* ---------- members ---------- */
  // A pending payment that has now gone through. It becomes paid today, and if
  // it was the member's renewal, their renewal date moves on by the period it
  // paid for — so "Payment due" clears on the members page with nothing else to
  // update (lib/payments.js decides the new date).
  const markPaymentPaid = useCallback(
    (paymentId) => {
      const payment = payments.find((p) => p.id === paymentId);
      if (!payment || payment.status !== "pending") return;
      const target = members.find((m) => m.id === payment.memberId);
      const ctx = { plans: studioPlans, programmes };
      const renewsAt = target ? renewalAfterPayment(target, payment, ctx) : null;
      setPayments((list) =>
        list.map((p) => (p.id === paymentId ? { ...p, status: "paid", paidAt: new Date().toISOString() } : p))
      );
      if (renewsAt) {
        setMembers((list) => list.map((m) => (m.id === target.id ? { ...m, renewsAt } : m)));
      }
      showToast(
        renewsAt
          ? `Marked paid — ${target.name} now renews ${formatDayMonth(renewsAt)}`
          : `Marked paid${target ? ` for ${target.name}` : ""}`
      );
    },
    [payments, members, studioPlans, programmes, showToast]
  );

  // Push a member's renewal back by some days — a real change to their date,
  // not just a message saying so. lib/members.js decides who can be gifted.
  const giftMemberDays = useCallback(
    (memberId, days) => {
      const target = members.find((m) => m.id === memberId);
      if (!target?.renewsAt) return;
      const renewsAt = giftedRenewal(target, days);
      setMembers((list) => list.map((m) => (m.id === memberId ? { ...m, renewsAt } : m)));
      showToast(`Gave ${target.name} ${days} extra days`);
    },
    [members, showToast]
  );

  // Stop or resume renewal. Stopping doesn't cut access off: it runs to the end
  // of the paid time and then ends, which is what a member has paid for.
  const setMemberAutoRenew = useCallback(
    (memberId, on) => {
      const target = members.find((m) => m.id === memberId);
      setMembers((list) => list.map((m) => (m.id === memberId ? { ...m, autoRenew: on } : m)));
      showToast(
        on
          ? `${target?.name || "Their"} subscription will renew again`
          : `${target?.name || "Their"} subscription won't renew — access runs to the end of the paid time`
      );
    },
    [members, showToast]
  );

  // Record a voucher against a member. Returns it, so the caller can put the
  // code in the email it opens.
  const addMemberVoucher = useCallback(
    (memberId, percent) => {
      const target = members.find((m) => m.id === memberId);
      if (!target) return null;
      const voucher = {
        id: nextId("voucher"),
        code: voucherCode(target, percent),
        percent,
        createdAt: new Date().toISOString(),
      };
      setMembers((list) =>
        list.map((m) => (m.id === memberId ? { ...m, vouchers: [...(m.vouchers || []), voucher] } : m))
      );
      showToast(`Voucher ${voucher.code} created for ${target.name}`);
      return voucher;
    },
    [members, showToast]
  );

  /* ---------- programmes ---------- */
  const addProgramme = useCallback(
    ({ name, description, type, startsOn, weeks }) => {
      const gradients = [
        "linear-gradient(120deg,#3a2e63,#241a3d)",
        "linear-gradient(120deg,#2E7D50,#1f5637)",
        "linear-gradient(120deg,#E39A2C,#c97e1b)",
        "linear-gradient(120deg,#F15B41,#D8452D)",
      ];
      const kind = type === "recorded" ? "recorded" : "live";
      const programme = {
        id: nextId("prog"),
        name: name || "Untitled programme",
        description: description || "",
        thumbGradient: gradients[programmes.length % gradients.length],
        icon: "person",
        type: kind,
        // Everything starts as a draft: a new programme has no content and no
        // link yet, so it must not be reachable from the public page.
        status: "draft",
        pricing: {
          certificate: false,
          shareUrl: `klubyou.co/${studio.handle}/${(name || "programme")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}`,
          offers: [],
        },
        // Set at creation for a live programme: the run window is what tells a
        // recurring series how many classes to create, so it can't come after.
        schedule:
          kind === "live"
            ? { startsOn: startsOn || null, weeks: Number(weeks) > 0 ? Number(weeks) : null }
            : null,
        classes: [],
        sections: [],
      };
      setProgrammes((list) => [...list, programme]);
      showToast("Programme created");
      return programme.id;
    },
    [programmes.length, showToast, studio.handle]
  );

  const updateProgramme = useCallback(
    (programmeId, patch) => {
      setProgrammes((list) => mapProgramme(list, programmeId, (p) => ({ ...p, ...patch })));
    },
    []
  );

  // Changing the run window never touches the classes already scheduled — one
  // that now falls outside it is flagged on the page rather than deleted
  // behind the creator's back.
  const updateRunWindow = useCallback(
    (programmeId, { startsOn, weeks }) => {
      setProgrammes((list) =>
        mapProgramme(list, programmeId, (p) => ({
          ...p,
          schedule: { ...p.schedule, startsOn, weeks: Number(weeks) > 0 ? Number(weeks) : null },
        }))
      );
    },
    []
  );

  // A programme could be created but never removed — the only thing in the app
  // with no way back out. Members who bought it keep their payment record;
  // what they lose is access, which is why the UI says so before this runs.
  const deleteProgramme = useCallback(
    (programmeId) => {
      setProgrammes((list) => list.filter((p) => p.id !== programmeId));
      // Nor can it go on being hidden from a page it no longer exists to be on.
      setStudio((s) => ({
        ...s,
        hiddenProgrammes: (s.hiddenProgrammes || []).filter((id) => id !== programmeId),
      }));
      showToast("Programme deleted");
    },
    [showToast]
  );

  /* ---------- lifecycle ---------- */
  const publishProgramme = useCallback(
    (programmeId) => {
      setProgrammes((list) => mapProgramme(list, programmeId, (p) => ({ ...p, status: "published" })));
      showToast("Programme published — it's live on your page");
    },
    [showToast]
  );

  const unpublishProgramme = useCallback(
    (programmeId) => {
      setProgrammes((list) => mapProgramme(list, programmeId, (p) => ({ ...p, status: "draft" })));
      showToast("Moved back to draft — hidden from your page");
    },
    [showToast]
  );

  /* ---------- pricing (tier 2: unlocks this programme only) ---------- */
  const addOffer = useCallback(
    (programmeId, offer) => {
      setProgrammes((list) =>
        mapProgramme(list, programmeId, (p) => ({
          ...p,
          pricing: {
            ...p.pricing,
            // Selling it on its own answers the pricing question, so the
            // studio-only choice can't still be standing.
            studioOnly: false,
            offers: [...(p.pricing?.offers || []), { id: nextId("offer"), ...offer }],
          },
        }))
      );
      showToast("Offer added");
    },
    [showToast]
  );

  const removeOffer = useCallback(
    (programmeId, offerId) => {
      setProgrammes((list) =>
        mapProgramme(list, programmeId, (p) => ({
          ...p,
          pricing: {
            ...p.pricing,
            offers: (p.pricing?.offers || []).filter((o) => o.id !== offerId),
          },
        }))
      );
      showToast("Offer removed");
    },
    [showToast]
  );

  // "No separate price, studio subscribers only" — an explicit answer to the
  // pricing question rather than the absence of one, which is what lets the
  // readiness checklist require the decision without forcing a price.
  const setStudioOnly = useCallback(
    (programmeId, studioOnly) => {
      setProgrammes((list) =>
        mapProgramme(list, programmeId, (p) => ({
          ...p,
          pricing: { ...p.pricing, studioOnly },
        }))
      );
      if (studioOnly) showToast("Studio subscribers only");
    },
    [showToast]
  );

  /* ---------- scheduled programmes: classes ---------- */
  // Creates one class per date. More than one date makes it a series, tied
  // together by a shared seriesId so the series-scoped actions below have
  // something real to act on.
  const addClasses = useCallback(
    (programmeId, { title, dates, venue }) => {
      const list = (dates || []).filter(Boolean);
      if (!list.length) return;
      const seriesId = list.length > 1 ? nextId("series") : null;
      setProgrammes((all) =>
        mapProgramme(all, programmeId, (p) => ({
          ...p,
          classes: [
            ...(p.classes || []),
            ...list.map((startsAt, i) => ({
              id: nextId("class"),
              seriesId,
              title: list.length > 1 ? `${title || "Class"} ${i + 1}` : title || "Untitled class",
              startsAt,
              venue: venue || { platform: "none", url: "" },
              active: true,
            })),
          ],
        }))
      );
      showToast(list.length > 1 ? `${list.length} classes added` : "Class added");
    },
    [showToast]
  );

  const updateClassLink = useCallback(
    (programmeId, classId, url) => {
      setProgrammes((list) =>
        mapProgramme(list, programmeId, (p) => ({
          ...p,
          classes: (p.classes || []).map((c) =>
            c.id === classId ? { ...c, venue: { platform: detectPlatform(url), url } } : c
          ),
        }))
      );
      showToast("Class link updated");
    },
    [showToast]
  );

  // scope "series" shifts every class in the same series by the same amount,
  // preserving the gaps between them. Previously this claimed to move the whole
  // series in its toast while only ever moving one class.
  const updateClassTiming = useCallback(
    (programmeId, classId, { startsAt, scope, notify }) => {
      let moved = 1;
      setProgrammes((list) =>
        mapProgramme(list, programmeId, (p) => {
          const target = (p.classes || []).find((c) => c.id === classId);
          if (!target) return p;
          const wholeSeries = scope === "series" && target.seriesId;
          const delta = new Date(startsAt).getTime() - new Date(target.startsAt).getTime();
          const affected = wholeSeries
            ? (p.classes || []).filter((c) => c.seriesId === target.seriesId)
            : [target];
          moved = affected.length;
          const ids = new Set(affected.map((c) => c.id));
          return {
            ...p,
            classes: (p.classes || []).map((c) => {
              if (!ids.has(c.id)) return c;
              if (c.id === classId) return { ...c, startsAt };
              return { ...c, startsAt: new Date(new Date(c.startsAt).getTime() + delta).toISOString() };
            }),
          };
        })
      );
      showToast(
        (moved > 1 ? `${moved} classes moved` : "Timing updated") + (notify ? " · members notified" : "")
      );
    },
    [showToast]
  );

  const toggleClassActive = useCallback(
    (programmeId, classId) => {
      let nowActive = true;
      setProgrammes((list) =>
        mapProgramme(list, programmeId, (p) => ({
          ...p,
          classes: (p.classes || []).map((c) => {
            if (c.id !== classId) return c;
            nowActive = !c.active;
            return { ...c, active: nowActive };
          }),
        }))
      );
      showToast(nowActive ? "Class reactivated" : "Class marked inactive");
    },
    [showToast]
  );

  // scope "series" now genuinely removes every class in the series.
  const deleteClass = useCallback(
    (programmeId, classId, scope) => {
      let removed = 1;
      setProgrammes((list) =>
        mapProgramme(list, programmeId, (p) => {
          const target = (p.classes || []).find((c) => c.id === classId);
          if (!target) return p;
          const wholeSeries = scope === "series" && target.seriesId;
          const doomed = wholeSeries
            ? (p.classes || []).filter((c) => c.seriesId === target.seriesId)
            : [target];
          removed = doomed.length;
          const ids = new Set(doomed.map((c) => c.id));
          return { ...p, classes: (p.classes || []).filter((c) => !ids.has(c.id)) };
        })
      );
      showToast(removed > 1 ? `${removed} classes deleted` : "Class deleted");
    },
    [showToast]
  );

  /* ---------- recorded programmes: sections & videos ---------- */
  const addSection = useCallback(
    (programmeId, title) => {
      setProgrammes((list) =>
        mapProgramme(list, programmeId, (p) => ({
          ...p,
          sections: [
            ...(p.sections || []),
            {
              id: nextId("sec"),
              order: (p.sections?.length || 0) + 1,
              title: title || "Untitled section",
              videos: [],
            },
          ],
        }))
      );
      showToast("Section added");
    },
    [showToast]
  );

  const updateSection = useCallback((programmeId, sectionId, patch) => {
    setProgrammes((list) =>
      mapProgramme(list, programmeId, (p) => ({
        ...p,
        sections: (p.sections || []).map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
      }))
    );
  }, []);

  const deleteSection = useCallback(
    (programmeId, sectionId) => {
      setProgrammes((list) =>
        mapProgramme(list, programmeId, (p) => ({
          ...p,
          // Re-number so `order` stays contiguous after a removal.
          sections: (p.sections || [])
            .filter((s) => s.id !== sectionId)
            .map((s, i) => ({ ...s, order: i + 1 })),
        }))
      );
      showToast("Section deleted");
    },
    [showToast]
  );

  const addVideo = useCallback(
    (programmeId, sectionId, video) => {
      setProgrammes((list) =>
        mapProgramme(list, programmeId, (p) => ({
          ...p,
          sections: (p.sections || []).map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  videos: [
                    ...(s.videos || []),
                    {
                      id: nextId("video"),
                      order: (s.videos?.length || 0) + 1,
                      title: video.title || "Untitled video",
                      video: video.video || "",
                      duration: video.duration || null,
                      active: true,
                    },
                  ],
                }
              : s
          ),
        }))
      );
      showToast("Video added");
    },
    [showToast]
  );

  const updateVideo = useCallback(
    (programmeId, sectionId, videoId, patch) => {
      setProgrammes((list) =>
        mapProgramme(list, programmeId, (p) => ({
          ...p,
          sections: (p.sections || []).map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  videos: (s.videos || []).map((l) =>
                    l.id === videoId ? { ...l, ...patch } : l
                  ),
                }
              : s
          ),
        }))
      );
    },
    []
  );

  const toggleVideoActive = useCallback(
    (programmeId, sectionId, videoId) => {
      let nowActive = true;
      setProgrammes((list) =>
        mapProgramme(list, programmeId, (p) => ({
          ...p,
          sections: (p.sections || []).map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  videos: (s.videos || []).map((l) => {
                    if (l.id !== videoId) return l;
                    nowActive = !l.active;
                    return { ...l, active: nowActive };
                  }),
                }
              : s
          ),
        }))
      );
      showToast(nowActive ? "Video published" : "Video hidden");
    },
    [showToast]
  );

  const deleteVideo = useCallback(
    (programmeId, sectionId, videoId) => {
      setProgrammes((list) =>
        mapProgramme(list, programmeId, (p) => ({
          ...p,
          sections: (p.sections || []).map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  videos: (s.videos || [])
                    .filter((l) => l.id !== videoId)
                    .map((l, i) => ({ ...l, order: i + 1 })),
                }
              : s
          ),
        }))
      );
      showToast("Video deleted");
    },
    [showToast]
  );

  // Reorder by swapping `order` with the neighbour in `dir` (-1 up, +1 down).
  const moveVideo = useCallback((programmeId, sectionId, videoId, dir) => {
    setProgrammes((list) =>
      mapProgramme(list, programmeId, (p) => ({
        ...p,
        sections: (p.sections || []).map((s) => {
          if (s.id !== sectionId) return s;
          const ordered = [...(s.videos || [])].sort((a, b) => a.order - b.order);
          const i = ordered.findIndex((l) => l.id === videoId);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= ordered.length) return s;
          [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
          return { ...s, videos: ordered.map((l, k) => ({ ...l, order: k + 1 })) };
        }),
      }))
    );
  }, []);

  const moveSection = useCallback((programmeId, sectionId, dir) => {
    setProgrammes((list) =>
      mapProgramme(list, programmeId, (p) => {
        const ordered = [...(p.sections || [])].sort((a, b) => a.order - b.order);
        const i = ordered.findIndex((s) => s.id === sectionId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= ordered.length) return p;
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
        return { ...p, sections: ordered.map((s, k) => ({ ...s, order: k + 1 })) };
      })
    );
  }, []);

  /* ---------- everyday lessons ---------- */
  // Everything about a lesson lives on one record, so there is one action to
  // change it and nothing to keep in step. A one-off carries a `date`, a
  // repeating one carries `days` — the same actions serve both.
  const addEverydayLesson = useCallback(
    ({ title, time, days, date, venueUrl }) => {
      const id = nextId("lesson");
      setEverydayLessons((list) => [
        ...list,
        {
          id,
          title: title || "Untitled lesson",
          time: time || "07:00",
          days: days || [],
          date: date || null,
          venueUrl: venueUrl || "",
          active: true,
        },
      ]);
      showToast("Lesson added");
      return id;
    },
    [showToast]
  );

  const updateEverydayLesson = useCallback(
    (lessonId, patch) => {
      setEverydayLessons((list) => list.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)));
      showToast("Lesson updated");
    },
    [showToast]
  );

  // Pausing keeps the lesson and its link — it just stops having a next
  // session, which is what the card reads off. Deleting is the only way to
  // lose it.
  const toggleEverydayLesson = useCallback(
    (lessonId) => {
      let paused = false;
      setEverydayLessons((list) =>
        list.map((l) => {
          if (l.id !== lessonId) return l;
          paused = l.active !== false;
          return { ...l, active: !paused };
        })
      );
      showToast(paused ? "Lesson paused" : "Lesson running again");
    },
    [showToast]
  );

  const deleteEverydayLesson = useCallback(
    (lessonId) => {
      setEverydayLessons((list) => list.filter((l) => l.id !== lessonId));
      showToast("Lesson removed");
    },
    [showToast]
  );

  const value = useMemo(
    () => ({
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
      coverSwatches,
      studioPlans,
      addStudioPlan,
      updateStudioPlan,
      setBestSellerPlan,
      setPlanBundles,
      setPlanExtras,
      bundles,
      addBundle,
      updateBundle,
      moveMembershipRow,
      deleteBundle,
      removeStudioPlan,
      membershipFeatures,
      addMembershipFeature,
      updateMembershipFeature,
      deleteMembershipFeature,
      members,
      giftMemberDays,
      setMemberAutoRenew,
      addMemberVoucher,
      programmes,
      addProgramme,
      updateProgramme,
      updateRunWindow,
      deleteProgramme,
      publishProgramme,
      unpublishProgramme,
      addOffer,
      removeOffer,
      setStudioOnly,
      addClasses,
      updateClassLink,
      updateClassTiming,
      toggleClassActive,
      deleteClass,
      addSection,
      updateSection,
      deleteSection,
      addVideo,
      updateVideo,
      toggleVideoActive,
      deleteVideo,
      moveVideo,
      moveSection,
      payments,
      markPaymentPaid,
      everydayLessons,
      addEverydayLesson,
      updateEverydayLesson,
      toggleEverydayLesson,
      deleteEverydayLesson,
    }),
    [
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
      addStudioPlan,
      updateStudioPlan,
      setBestSellerPlan,
      setPlanBundles,
      setPlanExtras,
      bundles,
      addBundle,
      updateBundle,
      moveMembershipRow,
      deleteBundle,
      removeStudioPlan,
      membershipFeatures,
      addMembershipFeature,
      updateMembershipFeature,
      deleteMembershipFeature,
      members,
      giftMemberDays,
      setMemberAutoRenew,
      addMemberVoucher,
      programmes,
      addProgramme,
      updateProgramme,
      updateRunWindow,
      deleteProgramme,
      publishProgramme,
      unpublishProgramme,
      addOffer,
      removeOffer,
      setStudioOnly,
      addClasses,
      updateClassLink,
      updateClassTiming,
      toggleClassActive,
      deleteClass,
      addSection,
      updateSection,
      deleteSection,
      addVideo,
      updateVideo,
      toggleVideoActive,
      deleteVideo,
      moveVideo,
      moveSection,
      payments,
      markPaymentPaid,
      everydayLessons,
      addEverydayLesson,
      updateEverydayLesson,
      toggleEverydayLesson,
      deleteEverydayLesson,
    ]

  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within an AppDataProvider");
  return ctx;
}
