import Modal from "../../common/Modal";
import MembershipComparison from "./MembershipComparison";
import { comparisonRows, publishedOnly } from "../../../lib/membership";

// What a member sees. The same idiom as "Preview as member" on a programme:
// you edit in one place and check the result here, rather than flipping the
// working table into a second mode that looks almost the same.
export default function MemberViewModal({ open, plans, bundles, programmes, lessons, features, onClose }) {
  // A draft plan isn't on sale, so it isn't a column here.
  const live = publishedOnly(plans);
  const rows = comparisonRows({ plans: live, bundles, programmes, lessons, features });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="What members see"
      maxWidth={760}
      footer={
        <button className="btn btn-ghost" onClick={onClose} data-tip="Back to editing">
          Close preview
        </button>
      }
    >
      {!live.length && (
        <p className="hint">
          No plan is published yet — members see nothing here until one is. Publish a plan from the
          cards view.
        </p>
      )}

      <MembershipComparison
        plans={live}
        bundles={bundles}
        programmes={programmes}
        lessons={lessons}
        features={features}
      />

      {live.length > 0 && !rows.length && (
        <p className="hint">
          These plans open nothing yet — publish a bundle or a benefit, then tick it into a plan.
        </p>
      )}
    </Modal>
  );
}
