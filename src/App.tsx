import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Route-level code splitting keeps Stripe.js and the donation page out of the
// initial download for visitors who only came to read about the band.
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Donate = lazy(() => import("./pages/Donate"));
const Legal = lazy(() => import("./pages/Legal"));
const NotFound = lazy(() => import("./pages/NotFound"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageLoading() {
  return (
    <div className="band bg-paper" role="status">
      <div className="mx-auto w-full max-w-6xl px-5 py-24">
        <span className="sr-only">Loading page</span>
        <div className="h-8 w-56 rounded-full bg-surface" />
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brass-bright focus:px-4 focus:py-2 focus:font-bold focus:text-night-950"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/privacy" element={<Legal slug="privacy" />} />
            <Route path="/terms" element={<Legal slug="terms" />} />
            <Route path="/accessibility" element={<Legal slug="accessibility" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
