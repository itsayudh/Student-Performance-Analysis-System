import RiskBadge from "./RiskBadge";

// Summary card for one prediction result.
//
// Props:
//   prediction - object matching your PredictionResponse / PredictionRecord
//                shape exactly:
//                { predicted_score, predicted_grade, failure_probability,
//                  risk_level, pass_fail, predicted_at }
function PredictionCard({ prediction }) {
  if (!prediction) {
    return (
      <div style={cardStyle}>
        <p style={{ fontSize: "13px", color: "#6B7080" }}>
          No prediction available yet. Run a prediction to see results here.
        </p>
      </div>
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
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "13px", color: "#6B7080", marginBottom: "6px" }}>
            Predicted score
          </p>
          <p
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "32px",
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            {predicted_score.toFixed(1)}
          </p>
        </div>
        <RiskBadge level={risk_level} />
      </div>

      <div style={{ display: "flex", gap: "24px", marginTop: "18px" }}>
        <div>
          <p style={{ fontSize: "12px", color: "#6B7080" }}>Predicted grade</p>
          <p style={{ fontSize: "18px", fontWeight: 600, marginTop: "2px" }}>{predicted_grade}</p>
        </div>
        <div>
          <p style={{ fontSize: "12px", color: "#6B7080" }}>Failure probability</p>
          <p style={{ fontSize: "18px", fontWeight: 600, marginTop: "2px" }}>
            {(failure_probability * 100).toFixed(0)}%
          </p>
        </div>
        <div>
          <p style={{ fontSize: "12px", color: "#6B7080" }}>Outcome</p>
          <p
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginTop: "2px",
              color: isPass ? "#1F9D63" : "#D14343",
            }}
          >
            {isPass ? "Pass" : "Fail"}
          </p>
        </div>
      </div>

      {predicted_at && (
        <p style={{ fontSize: "11px", color: "#6B7080", marginTop: "16px" }}>
          Predicted on {new Date(predicted_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  );
}

const cardStyle = {
  background: "#FFFFFF",
  border: "1px solid #E4E6EB",
  borderRadius: "12px",
  padding: "20px",
};

export default PredictionCard;