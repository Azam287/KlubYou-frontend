import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  coverSwatches,
  initialActivity,
  initialLiveClasses,
  initialMembers,
  initialPagePlans,
  initialPayments,
  initialProgrammes,
  initialStats,
  initialStudio,
  paymentStats,
  planMix,
} from "../data/mockData";
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

export function AppDataProvider({ children }) {
  const { showToast } = useToast();

  const [studio, setStudio] = useState(initialStudio);
  const [coverGradient, setCoverGradientState] = useState(initialStudio.coverGradient);
  const [pagePlans, setPagePlans] = useState(initialPagePlans);
  const [members, setMembers] = useState(initialMembers);
  const [programmes, setProgrammes] = useState(initialProgrammes);
  const [payments] = useState(initialPayments);
  const [liveClasses, setLiveClasses] = useState(initialLiveClasses);
  const [activity] = useState(initialActivity);

  /* ---------- profile / page ---------- */
  const updateStudio = useCallback((patch) => {
    setStudio((s) => ({ ...s, ...patch }));
  }, []);

  const setCoverGradient = useCallback((gradient) => {
    setCoverGradientState(gradient);
  }, []);

  const togglePagePlan = useCallback((key) => {
    setPagePlans((list) => list.map((p) => (p.key === key ? { ...p, on: !p.on } : p)));
  }, []);

  /* ---------- members ---------- */
  const memberAction = useCallback(
    (type, memberId) => {
      const member = members.find((m) => m.id === memberId);
      const name = member ? member.name : "";
      const messages = {
        gift: `Gave 7 bonus days to ${name}`,
        email: `Opening a message to ${name}…`,
        voucher: `Voucher sent to ${name}`,
        stop: `${name}'s subscription was stopped`,
        receipt: `Receipt sent to ${name}`,
      };
      if (type === "stop") {
        setMembers((list) =>
          list.map((m) => (m.id === memberId ? { ...m, status: "inactive", expiring: false } : m))
        );
      }
      showToast(messages[type] || "Done");
    },
    [members, showToast]
  );

  // Payments/receipts reference a member by name rather than id (that's how
  // the payments ledger is shaped), so offer a name-based variant too.
  const memberActionByName = useCallback(
    (type, name) => {
      const messages = {
        gift: `Gave 7 bonus days to ${name}`,
        email: `Opening a message to ${name}…`,
        voucher: `Voucher sent to ${name}`,
        stop: `${name}'s subscription was stopped`,
        receipt: `Receipt sent to ${name}`,
      };
      showToast(messages[type] || "Done");
    },
    [showToast]
  );

  /* ---------- programmes ---------- */
  const addProgramme = useCallback(
    ({ name, description, sellAsCourse, sellAsMembership }) => {
      const types = [
        ...(sellAsCourse ? ["course"] : []),
        ...(sellAsMembership ? ["membership"] : []),
      ];
      const gradients = [
        "linear-gradient(120deg,#3a2e63,#241a3d)",
        "linear-gradient(120deg,#2E7D50,#1f5637)",
        "linear-gradient(120deg,#E39A2C,#c97e1b)",
        "linear-gradient(120deg,#F15B41,#D8452D)",
      ];
      const programme = {
        id: nextId("prog"),
        name: name || "Untitled programme",
        description: description || "",
        thumbGradient: gradients[programmes.length % gradients.length],
        icon: "person",
        types: types.length ? types : ["course"],
        membersCount: 0,
        enrolledCount: 0,
        course: sellAsCourse
          ? {
              status: "Draft",
              enrollFrom: "—",
              enrollUntil: "—",
              runs: "—",
              price: "£0",
              certificate: false,
              shareUrl: `klubyou.co/${studio.handle}/${(name || "programme")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")}`,
              classes: [],
            }
          : null,
        membership: sellAsMembership ? { plans: [], classes: [] } : null,
      };
      setProgrammes((list) => [...list, programme]);
      showToast("Programme created");
      return programme.id;
    },
    [programmes.length, showToast, studio.handle]
  );

  const addPlan = useCallback(
    (programmeId, plan) => {
      setProgrammes((list) =>
        list.map((p) =>
          p.id === programmeId
            ? {
                ...p,
                membership: {
                  ...(p.membership || { classes: [] }),
                  plans: [...(p.membership?.plans || []), { id: nextId("plan"), ...plan }],
                },
              }
            : p
        )
      );
      showToast("Plan added");
    },
    [showToast]
  );

  const addClass = useCallback(
    (programmeId, section, classData) => {
      setProgrammes((list) =>
        list.map((p) => {
          if (p.id !== programmeId) return p;
          const target = p[section] || { classes: [] };
          const newClass = {
            id: nextId("class"),
            title: classData.title || "Untitled class",
            when: classData.when || "TBC",
            venue: classData.venue || { platform: "none", url: "" },
            active: true,
          };
          return { ...p, [section]: { ...target, classes: [...(target.classes || []), newClass] } };
        })
      );
      showToast("Class added");
    },
    [showToast]
  );

  const updateClassLink = useCallback(
    (programmeId, section, classId, url) => {
      setProgrammes((list) =>
        list.map((p) => {
          if (p.id !== programmeId) return p;
          const target = p[section];
          if (!target) return p;
          return {
            ...p,
            [section]: {
              ...target,
              classes: target.classes.map((c) =>
                c.id === classId ? { ...c, venue: { platform: detectPlatform(url), url } } : c
              ),
            },
          };
        })
      );
      showToast("Class link updated");
    },
    [showToast]
  );

  const updateClassTiming = useCallback(
    (programmeId, section, classId, { when, scope, notify }) => {
      setProgrammes((list) =>
        list.map((p) => {
          if (p.id !== programmeId) return p;
          const target = p[section];
          if (!target) return p;
          return {
            ...p,
            [section]: {
              ...target,
              classes: target.classes.map((c) => (c.id === classId ? { ...c, when } : c)),
            },
          };
        })
      );
      const series = scope === "series";
      showToast(
        (series ? "Series timing updated" : "Timing updated") + (notify ? " · members notified" : "")
      );
    },
    [showToast]
  );

  const toggleClassActive = useCallback(
    (programmeId, section, classId) => {
      let nowActive = true;
      setProgrammes((list) =>
        list.map((p) => {
          if (p.id !== programmeId) return p;
          const target = p[section];
          if (!target) return p;
          return {
            ...p,
            [section]: {
              ...target,
              classes: target.classes.map((c) => {
                if (c.id !== classId) return c;
                nowActive = !c.active;
                return { ...c, active: nowActive };
              }),
            },
          };
        })
      );
      showToast(nowActive ? "Class reactivated" : "Class marked inactive");
    },
    [showToast]
  );

  const deleteClass = useCallback(
    (programmeId, section, classId, scope) => {
      setProgrammes((list) =>
        list.map((p) => {
          if (p.id !== programmeId) return p;
          const target = p[section];
          if (!target) return p;
          return {
            ...p,
            [section]: { ...target, classes: target.classes.filter((c) => c.id !== classId) },
          };
        })
      );
      showToast(scope === "series" ? "Whole series deleted" : "Class deleted");
    },
    [showToast]
  );

  /* ---------- classes (live schedule) ---------- */
  const addLiveClass = useCallback(
    ({ title, meta }) => {
      setLiveClasses((list) => [
        ...list,
        { id: nextId("live"), title: title || "Untitled class", mode: "scheduled", meta: meta || "Scheduled" },
      ]);
      showToast("Class scheduled");
    },
    [showToast]
  );

  const addLinkToClass = useCallback(
    (classId, url) => {
      setLiveClasses((list) =>
        list.map((c) =>
          c.id === classId
            ? { ...c, mode: "scheduled", meta: `Venue set · ${url}`, venueUrl: url }
            : c
        )
      );
      showToast("Class link added");
    },
    [showToast]
  );

  const value = useMemo(
    () => ({
      studio,
      updateStudio,
      coverGradient,
      setCoverGradient,
      coverSwatches,
      pagePlans,
      togglePagePlan,
      stats: initialStats,
      planMix,
      activity,
      members,
      memberAction,
      memberActionByName,
      programmes,
      addProgramme,
      addPlan,
      addClass,
      updateClassLink,
      updateClassTiming,
      toggleClassActive,
      deleteClass,
      payments,
      paymentStats,
      liveClasses,
      addLiveClass,
      addLinkToClass,
    }),
    [
      studio,
      updateStudio,
      coverGradient,
      setCoverGradient,
      pagePlans,
      togglePagePlan,
      activity,
      members,
      memberAction,
      memberActionByName,
      programmes,
      addProgramme,
      addPlan,
      addClass,
      updateClassLink,
      updateClassTiming,
      toggleClassActive,
      deleteClass,
      payments,
      liveClasses,
      addLiveClass,
      addLinkToClass,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within an AppDataProvider");
  return ctx;
}
