import React from "react";
import { createRoot } from "react-dom/client";
import AkariChat from "./AkariChat.jsx";
import "./index.css";

// 予期しない例外で真っ白になるのを防ぐ。あかりの世界観を壊さない静かな表示に落とす。
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error, info) {
    // 本番では監視に送ってもよい。今は開発コンソールにだけ残す。
    console.error("AkariChat crashed:", error, info);
  }
  render() {
    if (this.state.failed) {
      return (
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
            color: "#6a5b4b",
            lineHeight: 2,
            fontSize: 15,
          }}
        >
          <div>
            ……ごめんなさい、うまく開けませんでした。
            <br />
            一度、ページを読み込み直してみてください。
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AkariChat />
    </ErrorBoundary>
  </React.StrictMode>
);
