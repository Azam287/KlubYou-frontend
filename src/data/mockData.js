// All demo/mock data for the KlubYou frontend-only prototype.
// Nothing here talks to a backend — it's just the initial state
// that AppDataContext keeps in memory for the demo.

export const initialStudio = {
  ownerName: "Maya",
  name: "Maya's Yoga Studio",
  tagline: "Vinyasa & breathwork · weekday mornings",
  about:
    "Hi, I'm Maya. I've taught vinyasa and breathwork for eight years. Join me for calm, strong weekday morning classes — live and from anywhere.",
  handle: "maya",
  coverGradient: "linear-gradient(120deg,#3a2e63,#241a3d)",
  rating: 4.9,
  classesPerWeek: 5,
};

export const coverSwatches = [
  { id: "violet", color: "#3a2e63", gradient: "linear-gradient(120deg,#3a2e63,#241a3d)" },
  { id: "coral", color: "#F15B41", gradient: "linear-gradient(120deg,#F15B41,#D8452D)" },
  { id: "green", color: "#2E7D50", gradient: "linear-gradient(120deg,#2E7D50,#1f5637)" },
  { id: "amber", color: "#E39A2C", gradient: "linear-gradient(120deg,#E39A2C,#c97e1b)" },
];

export const initialPagePlans = [
  { key: "membership", label: "Membership", on: true },
  { key: "course", label: "September Flow", on: true },
  { key: "dropin", label: "Drop-in", on: false },
];

export const initialStats = {
  activeMembers: { value: 142, delta: "+8 this week", flat: false },
  earnings: { value: "£2,480", delta: "+18% vs Aug", flat: false },
  renewalRate: { value: "86%", delta: "+3 pts", flat: false },
  coursesSold: { value: 37, delta: "September Flow", flat: true },
};

export const planMix = [
  { key: "subscriptions", label: "Subscriptions", value: 88, color: "#F15B41" },
  { key: "courses", label: "Courses", value: 37, color: "#221A38" },
  { key: "packs", label: "Packs & drop-ins", value: 17, color: "#C9BFE0" },
];

export const earningsSeries = [
  { month: "Apr", x: 20, y: 111 },
  { month: "May", x: 132, y: 94 },
  { month: "Jun", x: 244, y: 76 },
  { month: "Jul", x: 356, y: 88 },
  { month: "Aug", x: 468, y: 59 },
  { month: "Sep", x: 580, y: 37 },
];

export const initialActivity = [
  {
    id: "a1",
    icon: "money",
    text: ["Sam K.", " paid £92 for the 6-month plan"],
    when: "12 min ago",
  },
  {
    id: "a2",
    icon: "user",
    text: ["Aisha M.", " joined September Flow"],
    when: "1 hr ago",
  },
  {
    id: "a3",
    icon: "clock",
    text: ["Tom R.", "'s plan renews in 3 days"],
    when: "2 hr ago",
  },
  {
    id: "a4",
    icon: "cert",
    text: ["Emma Carter", " completed a course — certificate sent"],
    when: "Yesterday",
  },
];

export const takenHandles = ["yoga", "maya123", "studio", "flow", "admin", "test"];

export const initialMembers = [
  {
    id: "m1",
    name: "Emma Carter",
    initials: "EC",
    email: "emma@email.com",
    plan: "membership",
    planLabel: "Membership · 12-month",
    status: "active",
    joined: "Feb 2025",
    renews: "Feb 2026",
    attendance: "34 / 38",
  },
  {
    id: "m2",
    name: "Sam K.",
    initials: "SK",
    email: "sam.k@email.com",
    plan: "membership",
    planLabel: "Membership · 6-month",
    status: "active",
    joined: "Aug 2025",
    renews: "Feb 2026",
    attendance: "9 / 10",
  },
  {
    id: "m3",
    name: "Tom R.",
    initials: "TR",
    email: "tom@email.com",
    plan: "membership",
    planLabel: "Membership · 1-month",
    status: "active",
    expiring: true,
    joined: "Aug 2025",
    renews: "in 3 days",
    attendance: "6 / 8",
  },
  {
    id: "m4",
    name: "Aisha M.",
    initials: "AM",
    email: "aisha@email.com",
    plan: "course",
    planLabel: "Course · September Flow",
    status: "active",
    joined: "Sep 2025",
    renews: "Sep 30",
    attendance: "4 / 5",
  },
  {
    id: "m5",
    name: "Nadia P.",
    initials: "NP",
    email: "nadia@email.com",
    plan: "none",
    planLabel: "— visited page",
    status: "lead",
    joined: "Sep 4",
    renews: "—",
    attendance: "—",
  },
  {
    id: "m6",
    name: "Jon L.",
    initials: "JL",
    email: "jon@email.com",
    plan: "membership",
    planLabel: "Membership · 1-month",
    status: "inactive",
    joined: "Jun 2025",
    renews: "Ended Aug 1",
    attendance: "11 / 20",
  },
];

export const initialPayments = [
  {
    id: "p1",
    date: "Sep 6",
    member: "Sam K.",
    for: "6-month plan",
    amount: "£92.00",
    keep: "£82.80",
    status: "paid",
  },
  {
    id: "p2",
    date: "Sep 6",
    member: "Aisha M.",
    for: "September Flow",
    amount: "£40.00",
    keep: "£36.00",
    status: "paid",
  },
  {
    id: "p3",
    date: "Sep 5",
    member: "Nadia P.",
    for: "Store — mat",
    amount: "£38.00",
    keep: "£34.20",
    status: "paid",
  },
  {
    id: "p4",
    date: "Sep 5",
    member: "Tom R.",
    for: "1-month plan",
    amount: "£18.00",
    keep: "£16.20",
    status: "pending",
  },
  {
    id: "p5",
    date: "Sep 4",
    member: "Leo B.",
    for: "Gift voucher",
    amount: "£25.00",
    keep: "£22.50",
    status: "paid",
  },
];

export const paymentStats = {
  received: "£2,480",
  pending: "£310",
  pendingCount: 3,
  nextPayout: "£1,940",
  fee: "£248",
};

export const initialLiveClasses = [
  {
    id: "lc1",
    title: "Morning Vinyasa Flow",
    mode: "live",
    meta: "Live now · Google Meet · started 7:02am",
    flow: [
      { label: "Venue set", detail: "meet.google.com/abz-…", done: true },
      { label: "Link sent", detail: "In the 6:45am reminder", done: true },
      { label: "Attendance", detail: "84 / 142 joined so far", done: true },
      { label: "After class", detail: "Redirect expires", done: false },
    ],
  },
  {
    id: "lc2",
    title: "Hip Openers",
    mode: "scheduled",
    meta: "Thursday 7:00am · YouTube Live · 142 members will get the link",
  },
  {
    id: "lc3",
    title: "Restore & Breathe",
    mode: "draft",
    meta: "Sunday 9:00am · no venue link added yet",
  },
];

export const initialProgrammes = [
  {
    id: "morning-vinyasa",
    name: "Morning Vinyasa",
    description: "Strong, breath-led flows to start the day.",
    thumbGradient: "linear-gradient(120deg,#3a2e63,#241a3d)",
    icon: "person",
    types: ["course", "membership"],
    membersCount: 88,
    enrolledCount: 37,
    course: {
      status: "Enrolling",
      enrollFrom: "20 Aug",
      enrollUntil: "31 Aug",
      runs: "1–30 Sep",
      price: "£40",
      certificate: true,
      shareUrl: "klubyou.co/maya/morning-vinyasa",
      classes: [
        {
          id: "c1",
          title: "Week 1 · Foundations",
          when: "Thu 4 Sep · 7:00am",
          venue: { platform: "yt", url: "youtu.be/live/xk20" },
          active: true,
        },
        {
          id: "c2",
          title: "Week 2 · Hip openers",
          when: "Thu 11 Sep · 7:00am",
          venue: { platform: "zoom", url: "zoom.us/j/8841…" },
          active: true,
        },
        {
          id: "c3",
          title: "Week 3 · Backbends",
          when: "Thu 18 Sep · 7:00am",
          venue: { platform: "none", url: "" },
          active: false,
        },
      ],
    },
    membership: {
      plans: [
        { id: "pl1", length: "1 month", price: "£18" },
        { id: "pl2", length: "6 months", price: "£92" },
        { id: "pl3", length: "12 months", price: "£162" },
      ],
      classes: [
        {
          id: "mc1",
          title: "Weekday Morning Flow",
          when: "Mon–Fri · 7:00am",
          venue: { platform: "zoom", url: "zoom.us/j/771…" },
          active: true,
        },
        {
          id: "mc2",
          title: "Saturday Slow Flow",
          when: "Sat · 9:00am",
          venue: { platform: "yt", url: "youtu.be/live/mz4" },
          active: true,
        },
      ],
    },
  },
  {
    id: "restore-sleep",
    name: "Restore & Sleep",
    description: "Slow evening classes to wind down the week.",
    thumbGradient: "linear-gradient(120deg,#2E7D50,#1f5637)",
    icon: "leaf",
    types: ["membership"],
    membersCount: 31,
    enrolledCount: 0,
    course: null,
    membership: {
      plans: [
        { id: "pl4", length: "1 month", price: "£20" },
        { id: "pl5", length: "6 months", price: "£100" },
      ],
      classes: [
        {
          id: "mc3",
          title: "Sunday Wind Down",
          when: "Sun · 7:00pm",
          venue: { platform: "zoom", url: "zoom.us/j/552…" },
          active: true,
        },
      ],
    },
  },
];
