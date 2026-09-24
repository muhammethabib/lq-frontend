// js/page_chrome.js
// The top bar and the side menu, written once.
//
// Every page carries the same chrome, so the markup lives here rather than
// being copied into each file. The English text sits in this template with
// its data-i18n keys, exactly as it would in a page, and the language sweep
// translates it like any other markup.
//
// At integration this becomes a Rails layout and a partial; nothing about the
// markup has to change, it just moves.
//
// It is a template literal rather than a separate .html file on purpose: a
// file would have to be fetched on every page before the chrome could be
// drawn, which is a request and a flash of an empty menu on each of the
// thirteen pages. A string costs neither. The account window's markup rides
// along for the same reason, in a <template> the Rails side can lift out
// exactly as it lifts the citation and dictionary-page templates out of
// pages/home.html.
//
// A page opts in with a single element:
//   <div data-controller="page-chrome language"></div>

// The pages that have been rebuilt. A menu entry naming one of these becomes
// a live link; the rest stay marked "soon".
window.LQ_BUILT_PAGES = ["about", "institutional", "what-is-lexiqamus", "team", "pricing", "lq1", "suggestions-history", "user-guide", "lq3-whats-new", "lq2-whats-new", "data-model", "lexicon-digitization"];

window.LQ_PAGE_CHROME = `
  <nav class="offcanvas offcanvas-start side-menu" tabindex="-1" id="sideMenu" aria-labelledby="sideMenuLabel">
    <div class="offcanvas-header side-menu-head">
      <a class="side-menu-logo" href="home.html" data-chrome-home
         data-action="click->page-chrome#goHome">
        <img src="../assets/lexiqamus-logo.png" alt="LexiQamus">
      </a>
      <h2 class="visually-hidden" id="sideMenuLabel" data-i18n="menuHeading">Menu</h2>
      <div class="language-switch" role="group" aria-label="Language" data-i18n-aria="ariaLanguage">
        <span class="language-thumb" aria-hidden="true"></span>
        <button type="button" class="btn language-option active" data-language="en" aria-pressed="true"
                data-language-target="option" data-action="click->language#select">EN</button>
        <button type="button" class="btn language-option" data-language="tr" aria-pressed="false"
                data-language-target="option" data-action="click->language#select">TR</button>
      </div>
    </div>

    <div class="side-menu-auth">
      <button type="button" class="btn btn-sm side-auth-ghost" data-mode="signin"
              data-action="click->page-chrome#openAuth" data-i18n="menuSignIn">Sign in</button>
      <button type="button" class="btn btn-sm side-auth-primary" data-mode="signup"
              data-action="click->page-chrome#openAuth" data-i18n="menuSignUp">Sign up</button>
    </div>

    <div class="offcanvas-body side-menu-body">
      <ul class="side-nav">
        <li>
          <a class="side-link is-unavailable" aria-disabled="true" data-page="about"
            >
            <svg class="side-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"></circle><circle cx="12" cy="7.6" r="1.5" fill="var(--lq-cut)"></circle><path d="M12 11.2v6" fill="none" stroke="var(--lq-cut)" stroke-width="2.4"></path></svg><span data-i18n="menuAbout">About</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
        </li>
        <li>
          <a class="side-link is-unavailable" aria-disabled="true" data-page="team"
            >
            <svg class="side-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8.2" r="3.6" fill="currentColor"></circle><path d="M2.4 20.2c0-3.4 2.9-5.6 6.6-5.6s6.6 2.2 6.6 5.6z" fill="currentColor"></path><circle cx="17.4" cy="7.4" r="2.7" fill="currentColor" opacity=".55"></circle><path d="M17.4 12.6c2.9 0 4.7 1.8 4.7 4.4h-4.2" fill="currentColor" opacity=".55"></path></svg><span data-i18n="menuTeam">Team</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
        </li>
        <li>
          <a class="side-link is-unavailable" aria-disabled="true" data-page="what-is-lexiqamus"
            >
            <svg class="side-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"></circle><path d="M9.3 9.1a2.8 2.8 0 0 1 5.4.9c0 1.9-2.7 2.3-2.7 4" fill="none" stroke="var(--lq-cut)" stroke-width="2.1"></path><circle cx="12" cy="17.3" r="1.4" fill="var(--lq-cut)"></circle></svg><span data-i18n="menuWhat">What is LexiQamus?</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
        </li>
        <li>
          <a class="side-link is-unavailable" aria-disabled="true" data-page="user-guide"
            >
            <svg class="side-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 3.8A1.8 1.8 0 0 1 7.3 2h6.9l4.3 4.3V20a1.8 1.8 0 0 1-1.8 1.8H7.3A1.8 1.8 0 0 1 5.5 20z" fill="currentColor"></path><path d="M14 2.4V7h4.4" fill="none" stroke="var(--lq-cut)" stroke-width="1.5"></path><path d="M9 12.5h6M9 16h6" fill="none" stroke="var(--lq-cut)" stroke-width="1.8"></path></svg><span data-i18n="menuGuide">Instructions</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
        </li>
        <li>
          <a class="side-link is-unavailable" aria-disabled="true" data-page="institutional"
            >
            <svg class="side-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 21.8 8.6H2.2z" fill="currentColor"></path><rect x="2.2" y="8.6" width="19.6" height="1.5" fill="currentColor"></rect><rect x="5.9" y="9.6" width="2.6" height="9.2" fill="currentColor"></rect><rect x="10.7" y="9.6" width="2.6" height="9.2" fill="currentColor"></rect><rect x="15.5" y="9.6" width="2.6" height="9.2" fill="currentColor"></rect><rect x="2.2" y="18.8" width="19.6" height="1.6" fill="currentColor"></rect></svg><span data-i18n="menuInstitutional">Institutional Subscribers</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
        </li>

        <!-- Version entries group their own sub-pages; Bootstrap's collapse
             drives the accordion. -->
        <li>
          <button type="button" class="btn side-link side-link-parent" data-bs-toggle="collapse"
                  data-bs-target="#menuVersion3" aria-expanded="false" aria-controls="menuVersion3">
            <svg class="side-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="11" r="9" fill="currentColor"></circle><circle cx="10" cy="11" r="6.4" fill="var(--lq-cut)"></circle><path d="M16.4 17.4l4.4 4.4" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" fill="none"></path><path d="M5.77 10.25 12.76 7.71" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"></path><path d="M12.76 7.71 11.47 15.04" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"></path><path d="M11.47 15.04 5.77 10.25" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"></path><circle cx="5.77" cy="10.25" r="2.1" fill="currentColor"></circle><circle cx="12.76" cy="7.71" r="2.1" fill="currentColor"></circle><circle cx="11.47" cy="15.04" r="2.1" fill="currentColor"></circle></svg>
            <span data-i18n="menuLQ3">LexiQamus 3.0</span>
            <span class="side-year">2026</span>
            <i class="side-chevron" data-feather="chevron-down"></i>
          </button>
          <ul class="collapse side-submenu" id="menuVersion3">
            <li>
              <a class="side-sublink is-unavailable" aria-disabled="true" data-page="data-model"
                 ><span data-i18n="menuV3DataModel">Digitization and Data Model</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
            </li>
            <li>
              <a class="side-sublink is-unavailable" aria-disabled="true" data-page="lq3-whats-new"
                 ><span data-i18n="menuV3WhatsNew">What&rsquo;s New</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
            </li>
          </ul>
        </li>
        <li>
          <button type="button" class="btn side-link side-link-parent" data-bs-toggle="collapse"
                  data-bs-target="#menuVersion2" aria-expanded="false" aria-controls="menuVersion2">
            <svg class="side-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="11" r="9" fill="currentColor"></circle><circle cx="10" cy="11" r="6.4" fill="var(--lq-cut)"></circle><path d="M16.4 17.4l4.4 4.4" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" fill="none"></path><path d="M7.2 12.9 12.8 9.1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"></path><circle cx="7.2" cy="12.9" r="2.1" fill="currentColor"></circle><circle cx="12.8" cy="9.1" r="2.1" fill="currentColor"></circle></svg>
            <span data-i18n="menuLQ2">LexiQamus 2.0</span>
            <span class="side-year">2020</span>
            <i class="side-chevron" data-feather="chevron-down"></i>
          </button>
          <ul class="collapse side-submenu" id="menuVersion2">
            <li>
              <a class="side-sublink is-unavailable" aria-disabled="true" data-page="lexicon-digitization"
                 ><span data-i18n="menuLexicon">Lexicon Digitization Project</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
            </li>
            <li>
              <a class="side-sublink is-unavailable" aria-disabled="true" data-page="lq2-whats-new"
                 ><span data-i18n="menuV2WhatsNew">What&rsquo;s New</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
            </li>
          </ul>
        </li>
        <li>
          <a class="side-link is-unavailable" aria-disabled="true" data-page="lq1"
            >
            <svg class="side-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="11" r="9" fill="currentColor"></circle><circle cx="10" cy="11" r="6.4" fill="var(--lq-cut)"></circle><path d="M16.4 17.4l4.4 4.4" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" fill="none"></path><circle cx="10" cy="11" r="2.1" fill="currentColor"></circle></svg>
            <span data-i18n="menuLQ1">LexiQamus 1.0</span>
            <span class="side-year">2016</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
        </li>

        <li>
          <a class="side-link is-unavailable" aria-disabled="true" data-page="suggestions-history"
            >
            <svg class="side-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21l1.2-4.8L15.4 5l3.6 3.6L7.8 19.8 3 21z" fill="currentColor"></path><path d="M16.6 3.8l1-1a1.9 1.9 0 0 1 2.7 0l.9.9a1.9 1.9 0 0 1 0 2.7l-1 1z" fill="currentColor"></path><path d="M14.2 6.2l3.6 3.6" fill="none" stroke="var(--lq-cut)" stroke-width="1.5"></path></svg><span data-i18n="menuUpdates">History of Suggestions and Corrections</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
        </li>
        <li>
          <a class="side-link is-unavailable" aria-disabled="true" data-page="pricing"
            >
            <svg class="side-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 5.4A1.8 1.8 0 0 1 5.4 3.6h6.2a1.8 1.8 0 0 1 1.3.5l7 7a1.8 1.8 0 0 1 0 2.6l-6.2 6.2a1.8 1.8 0 0 1-2.6 0l-7-7a1.8 1.8 0 0 1-.5-1.3z" fill="currentColor"></path><circle cx="8.4" cy="8.4" r="1.9" fill="var(--lq-cut)"></circle></svg><span data-i18n="menuPricing">Pricing</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
        </li>
      </ul>
    </div>
  </nav>

  <!-- ============================== top row ============================== -->
  <div class="page-top-row">
    <button type="button" class="btn menu-button" data-bs-toggle="offcanvas" data-bs-target="#sideMenu"
            aria-controls="sideMenu" aria-label="Menu" data-i18n-aria="menuHeading">
      <i data-feather="menu"></i>
    </button>

    <!-- The way back to the main page. The main page carries its own
         wordmark, so the controller takes this out there. -->
    <a class="top-row-logo" href="home.html" data-chrome-home
       aria-label="LexiQamus home" data-i18n-aria="ariaHome">
      <img src="../assets/lexiqamus-logo.png" alt="LexiQamus">
    </a>

    <div class="top-row-right">
      <a class="classic-link" href="https://www.lexiqamus.com/" target="_blank" rel="noopener"
         title="Open the previous stable version" data-i18n-title="legacyTitle">
        <span data-i18n="legacyLink">Classic version</span>
        <i data-feather="external-link"></i>
      </a>

      <div class="language-switch" role="group" aria-label="Language" data-i18n-aria="ariaLanguage">
        <span class="language-thumb" aria-hidden="true"></span>
        <button type="button" class="btn language-option active" data-language="en" aria-pressed="true"
                data-language-target="option" data-action="click->language#select">EN</button>
        <button type="button" class="btn language-option" data-language="tr" aria-pressed="false"
                data-language-target="option" data-action="click->language#select">TR</button>
      </div>
    </div>
  </div>

  <!-- The account window. Empty until one of the buttons above is pressed;
       its markup is in the template below. -->
  <div class="modal fade auth-modal" id="authModal" tabindex="-1" aria-hidden="true"></div>

  <template id="authTemplate">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="auth-title" data-auth-title data-i18n="menuSignUp">Sign up</h2>
          <button type="button" class="btn window-close" data-bs-dismiss="modal"
                  aria-label="Close" data-i18n-aria="close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body tab-content">
          <!-- Sign in -->
          <div class="tab-pane fade" id="signInPane" role="tabpanel" aria-labelledby="signInTab">
            <form class="auth-form" novalidate>
              <div class="auth-field">
                <label for="signInEmail" data-i18n="authEmail">Email</label>
                <input type="email" id="signInEmail" class="form-control" autocomplete="email" required>
              </div>
              <div class="auth-field">
                <label for="signInPassword" data-i18n="authPassword">Password</label>
                <input type="password" id="signInPassword" class="form-control"
                       autocomplete="current-password" required>
              </div>
              <a class="auth-forgot" href="#" data-i18n="authForgot">Forgotten your password?</a>
              <button type="submit" class="btn auth-submit" data-i18n="authSignIn">Sign in</button>
            </form>
          </div>

          <!-- Sign up -->
          <div class="tab-pane fade" id="signUpPane" role="tabpanel" aria-labelledby="signUpTab">
            <form class="auth-form" novalidate>
              <div class="auth-field">
                <label for="signUpFirst" data-i18n="authFirstName">First name</label>
                <input type="text" id="signUpFirst" class="form-control" autocomplete="given-name" required>
              </div>
              <div class="auth-field">
                <label for="signUpLast" data-i18n="authLastName">Last name</label>
                <input type="text" id="signUpLast" class="form-control" autocomplete="family-name" required>
              </div>
              <div class="auth-field">
                <label for="signUpEmail" data-i18n="authEmail">Email</label>
                <input type="email" id="signUpEmail" class="form-control" autocomplete="email" required>
              </div>
              <div class="auth-field">
                <label for="signUpPassword" data-i18n="authPassword">Password</label>
                <input type="password" id="signUpPassword" class="form-control"
                       autocomplete="new-password" aria-describedby="signUpPasswordHint" required>
                <p class="auth-hint" id="signUpPasswordHint" data-i18n="authPasswordHint">Must be at least 8 characters, alphanumeric, and include at least one capital letter.</p>
              </div>
              <div class="auth-field">
                <label for="signUpPasswordAgain" data-i18n="authPasswordAgain">Password (again)</label>
                <input type="password" id="signUpPasswordAgain" class="form-control"
                       autocomplete="new-password" required>
              </div>

              <div class="form-check auth-check">
                <input class="form-check-input" type="checkbox" id="signUpNews" checked>
                <label class="form-check-label" for="signUpNews" data-i18n="authNewsletter">I would like to receive news about LexiQamus by email.</label>
              </div>
              <div class="form-check auth-check">
                <input class="form-check-input" type="checkbox" id="signUpTerms" required>
                <label class="form-check-label" for="signUpTerms" data-i18n="authTerms" data-i18n-html="1">I have read and accept the <a href="#">membership agreement</a>.</label>
              </div>

              <!-- Stands in for the challenge the backend will run -->
              <p class="auth-verified">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"></circle><path d="M7.6 12.4l2.9 2.9 5.9-5.9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                <span data-i18n="authVerified">Verified</span>
                <span class="auth-vendor">Cloudflare</span>
              </p>

              <button type="submit" class="btn auth-submit" data-i18n="authCreate">Create account</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </template>
`;
