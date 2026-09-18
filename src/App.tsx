import { Link, Route, Routes } from "react-router-dom";
import { SiteHeader } from "./components/Chrome";
import AppLayout from "./pages/AppLayout";
import Interfaces from "./pages/Interfaces";
import Landing from "./pages/Landing";
import Overview from "./pages/Overview";
import SignIn from "./pages/SignIn";

function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="wrap" style={{ padding: "4rem 1.25rem" }}>
        <h1>Page not found</h1>
        <p style={{ marginTop: "0.75rem", color: "var(--fg-muted)" }}>
          That page does not exist.
        </p>
        <p style={{ marginTop: "1.5rem" }}>
          <Link to="/">← Back to the site</Link>
        </p>
      </main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Overview />} />
        <Route path="interfaces" element={<Interfaces />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
