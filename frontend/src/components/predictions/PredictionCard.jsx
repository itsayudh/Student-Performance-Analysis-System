import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import RiskBadge from "./RiskBadge";
import Panel from "../gridline/Panel";
import { color, numSx } from "../../theme/tokens";
import { formatDate, formatFailureProbability } from "../../utils/formatters";

// Summary card for one prediction result.
// Props contract unchanged: { prediction } matching PredictionResponse.
//
// v2 (GRIDLINE): rebuilt from raw divs + inline styles to Panel +
// Typography. The old version predated the theme entirely — inline
// styles are invisible to MUI theming, which is why it stayed white in
// dark mode and kept the retired Fraunces font.
function PredictionCard({ prediction }) {
  if (!prediction) {
    return (
      <Panel>
        <Typography variant="body2" color="text.secondary">
          No prediction available yet. Run a prediction to see results here.
        </Typography>
      </Panel>
    );
  }

  const {
    predicted_score,
    predicted_grade,
    failure_probability,
    risk_level,
    pass_fail,
    predicted_at,
  } = prediction;

  const isPass = pass_fail === "PASS" || pass_fail === 1;

  return (
    <Panel>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Predicted score
          </Typography>
          <Typography sx={{ ...numSx, fontSize: 32, fontWeight: 600, lineHeight: 1 }}>
            {predicted_score.toFixed(1)}
          </Typography>
        </Box>
        <RiskBadge level={risk_level} />
      </Box>

      <Box sx={{ display: "flex", gap: 3, mt: 2.25 }}>
        <Stat label="Predicted grade" value={predicted_grade} />
        <Stat label="Failure probability" value={formatFailureProbability(failure_probability)} />
        <Stat
          label="Outcome"
          value={isPass ? "Pass" : "Fail"}
          valueColor={isPass ? color.success : color.danger}
        />
      </Box>

      {predicted_at && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
          Predicted on {formatDate(predicted_at)}
        </Typography>
      )}
    </Panel>
  );
}

function Stat({ label, value, valueColor }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ ...numSx, fontSize: 18, fontWeight: 600, mt: 0.25, color: valueColor || "text.primary" }}>
        {value}
      </Typography>
    </Box>
  );
}

export default PredictionCard;