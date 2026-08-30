import { AllWorkSection } from '../components/AllWorkSection';
import { CollectionsSection } from '../components/CollectionsSection';
import { IntroSection } from '../components/IntroSection';
import { PageShell } from '../components/PageShell';
import { MOCK_COLLECTIONS, MOCK_PIECES } from '../lib/mock-data';

// The intro belongs on the root gallery view; hide it on filtered or
// collection routes when those are built.
const SHOW_INTRO = true;

const LandingPage = () => (
  <PageShell>
    {SHOW_INTRO && <IntroSection />}
    <CollectionsSection collections={MOCK_COLLECTIONS} />
    <AllWorkSection pieces={MOCK_PIECES} />
  </PageShell>
);

export default LandingPage;
