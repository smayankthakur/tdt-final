import './learn.css';
import { LEARN_PAGE_HTML, learnModalHtml } from './learnHtml';
import LearnScripts from './LearnScripts';

/** The old learn.thedivinetarotonline.com page; with `openKey`, that course's details are open. */
export default function LearnPage({ openKey }: { openKey?: string }) {
  return (
    <div className="learn-site">
      <noscript>
        <style>{'.learn-site .reveal{opacity:1 !important}'}</style>
      </noscript>
      <div dangerouslySetInnerHTML={{ __html: LEARN_PAGE_HTML + learnModalHtml(openKey) }} />
      <LearnScripts openSlugOnLoad={!!openKey} />
    </div>
  );
}
