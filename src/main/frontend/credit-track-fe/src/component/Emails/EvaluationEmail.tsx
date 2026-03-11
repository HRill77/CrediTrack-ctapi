import React, { useState, useEffect } from "react";
import EvaluationEmailService, {
  EvaluationEmailData,
} from "../../shared/services/EvaluationEmailService";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  fromUniversity: string;
  toProgram?: string;
}

interface CrediTrackEmailProps {
  studentIds?: number[];
  recipient?: string;
  programHeadId?: number;
  onClose?: () => void;
  isOpen?: boolean;
}

interface DisplayData {
  students: Student[];
  recipient: string;
}

const CrediTrackIcon: React.FC = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Document body */}
    <rect
      x="8"
      y="4"
      width="26"
      height="34"
      rx="3"
      stroke="#1a5c2a"
      strokeWidth="2"
      fill="none"
    />
    {/* Folded corner */}
    <path
      d="M28 4 L34 10 L28 10 Z"
      stroke="#1a5c2a"
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
    {/* Lines on document */}
    <line
      x1="13"
      y1="17"
      x2="28"
      y2="17"
      stroke="#1a5c2a"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="13"
      y1="22"
      x2="28"
      y2="22"
      stroke="#1a5c2a"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="13"
      y1="27"
      x2="22"
      y2="27"
      stroke="#1a5c2a"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Circular badge bottom-right */}
    <circle
      cx="33"
      cy="34"
      r="9"
      fill="#eef5ee"
      stroke="#1a5c2a"
      strokeWidth="1.5"
    />
    {/* Checkmark inside circle */}
    <path
      d="M28.5 34 L31.5 37 L37.5 31"
      stroke="#1a5c2a"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const CrediTrackEmail: React.FC<CrediTrackEmailProps> = ({
  studentIds = [],
  recipient = "",
  programHeadId,
  onClose,
  isOpen = true,
}) => {
  const [displayData, setDisplayData] = useState<DisplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluationData = async () => {
      if (!isOpen || studentIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Use the EvaluationEmailService to fetch data
        const emailData =
          await EvaluationEmailService.getEvaluationEmailData(studentIds);

        setDisplayData({
          students: emailData.students,
          recipient: emailData.recipient || recipient,
        });

        setLoading(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch evaluation data";
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchEvaluationData();
  }, [isOpen, studentIds, recipient]);

  if (!isOpen) {
    return null;
  }

  if (loading) {
    return (
      <div className="email-bg">
        <div className="email-wrapper">
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ fontSize: "16px", color: "#666" }}>
              Loading evaluation email...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !displayData) {
    return (
      <div className="email-bg">
        <div className="email-wrapper">
          <div
            style={{ textAlign: "center", padding: "40px", color: "#d32f2f" }}
          >
            <p style={{ fontSize: "16px" }}>
              Error: {error || "Unable to load evaluation data"}
            </p>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  marginTop: "16px",
                  padding: "8px 16px",
                  background: "#1a5c2a",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleViewResults = () => {
    // Navigate to evaluation results page or trigger download
    if (studentIds.length === 1) {
      window.location.href = `/evaluation/student/${studentIds[0]}/results`;
    } else {
      window.location.href = `/evaluation/results?ids=${studentIds.join(",")}`;
    }
  };
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body, html {
          font-family: 'Poppins', sans-serif;
        }

        .email-bg {
          background-color: #ebebeb;
          min-height: 100vh;
          padding: 48px 16px;
          font-family: 'Poppins', sans-serif;
        }

        .email-wrapper {
          max-width: 620px;
          margin: 0 auto;
        }

        .email-title {
          text-align: center;
          font-family: 'Poppins', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #1a5c2a;
          margin-bottom: 24px;
        }

        .email-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          overflow: hidden;
        }

        .card-body {
          padding: 36px 40px 28px;
        }

        .greeting {
          font-size: 14px;
          font-weight: 400;
          color: #222;
          margin-bottom: 16px;
        }

        .intro-text {
          font-size: 13.5px;
          color: #222;
          line-height: 1.7;
          margin-bottom: 14px;
        }

        .student-list {
          list-style: none;
          padding: 0;
          margin: 0 0 16px 0;
        }

        .student-list li {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-size: 13.5px;
          color: #222;
          font-style: italic;
          line-height: 1.7;
          padding: 1px 0;
        }

        .student-num {
          font-style: normal;
          font-weight: 500;
          min-width: 18px;
        }

        .download-text {
          font-size: 13.5px;
          color: #222;
          line-height: 1.7;
          margin-bottom: 16px;
        }

        .advisory-text {
          font-size: 13.5px;
          color: #222;
          line-height: 1.7;
          margin-bottom: 24px;
        }

        .signature {
          font-size: 13.5px;
          color: #222;
          line-height: 1.7;
          margin-bottom: 28px;
        }

        .signature-name {
          font-weight: 700;
          display: block;
        }

        .cta-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }

        .cta-btn {
          display: inline-block;
          background-color: #1a5c2a;
          color: #ffffff;
          text-decoration: none;
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 500;
          padding: 10px 32px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          letter-spacing: 0.01em;
        }

        .cta-btn:hover {
          background-color: #174f23;
        }

        .card-footer {
          border-top: 1px solid #e8e8e8;
          padding: 20px 40px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .footer-brand-name {
          font-family: 'Poppins', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #1a5c2a;
          line-height: 1;
        }

        .footer-sub {
          font-size: 10px;
          color: #888;
          margin-top: 3px;
          line-height: 1.5;
        }
      `}</style>

      <div className="email-bg">
        <div className="email-wrapper">
          {/* Title */}
          <h1 className="email-title">
            An initial CrediTrack result has been sent!
          </h1>

          {/* Card */}
          <div className="email-card">
            <div className="card-body">
              <p className="greeting">Greetings!</p>

              <p className="intro-text">
                The CrediTrack results for the following students is attached to
                this email:
              </p>

              {/* Student list */}
              <ol className="student-list">
                {displayData?.students.map((student, index) => (
                  <li key={student.id || index}>
                    <span className="student-num">{index + 1}.</span>
                    <span>
                      {student.lastName}, {student.firstName} –{" "}
                      {student.fromUniversity}
                      {student.toProgram && ` (To: ${student.toProgram})`}
                    </span>
                  </li>
                ))}
              </ol>

              <p className="download-text">
                Please feel free to download and review the file at your
                convenience.
              </p>

              <p className="advisory-text">
                Please be advised that this is only an initial review. A manual
                verification process is still required to ensure the accuracy
                and completeness of the result.
              </p>

              <div className="signature">
                Best regards,
                <span className="signature-name">CrediTrack</span>
              </div>

              {/* Download Button */}
              <div className="cta-wrap">
                <button className="cta-btn" onClick={handleViewResults}>
                  View Results
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="card-footer">
              <CrediTrackIcon />
              <div>
                <div className="footer-brand-name">CrediTrack</div>
                <div className="footer-sub">
                  College of Engineering and Computer Technology
                  <br />
                  Copyright © 2026 CrediTrack. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CrediTrackEmail;
