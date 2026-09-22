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
// A page opts in with a single element:
//   <div data-controller="page-chrome language"></div>

// The pages that have been rebuilt. A menu entry naming one of these becomes
// a live link; the rest stay marked "soon".
window.LQ_BUILT_PAGES = ["about", "institutional", "what-is-lexiqamus", "team", "pricing", "lq1"];

window.LQ_PAGE_CHROME = `
  <nav class="offcanvas offcanvas-start side-menu" tabindex="-1" id="sideMenu" aria-labelledby="sideMenuLabel">
    <div class="offcanvas-header side-menu-head">
      <a class="side-menu-logo" href="home.html">
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
      <button type="button" class="btn btn-sm side-auth-ghost" data-i18n="menuSignIn">Sign in</button>
      <button type="button" class="btn btn-sm side-auth-primary" data-i18n="menuSignUp">Sign up</button>
    </div>

    <div class="offcanvas-body side-menu-body">
      <ul class="side-nav">
        <li>
          <a class="side-link is-unavailable" aria-disabled="true" data-page="about"
            >
            <i data-feather="info"></i><span data-i18n="menuAbout">About</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
        </li>
        <li>
          <a class="side-link is-unavailable" aria-disabled="true" data-page="team"
            >
            <i data-feather="users"></i><span data-i18n="menuTeam">Team</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
        </li>
        <li>
          <a class="side-link is-unavailable" aria-disabled="true" data-page="what-is-lexiqamus"
            >
            <i data-feather="help-circle"></i><span data-i18n="menuWhat">What is LexiQamus?</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
        </li>
        <li>
          <a class="side-link is-unavailable" aria-disabled="true" data-page="user-guide"
            >
            <i data-feather="book-open"></i><span data-i18n="menuGuide">Instructions</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
        </li>
        <li>
          <a class="side-link is-unavailable" aria-disabled="true" data-page="institutional"
            >
            <i data-feather="briefcase"></i><span data-i18n="menuInstitutional">Institutional Subscribers</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
        </li>

        <!-- Version entries group their own sub-pages; Bootstrap's collapse
             drives the accordion. -->
        <li>
          <button type="button" class="btn side-link side-link-parent" data-bs-toggle="collapse"
                  data-bs-target="#menuVersion3" aria-expanded="false" aria-controls="menuVersion3">
            <i data-feather="search"></i>
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
            <i data-feather="search"></i>
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
            <i data-feather="search"></i>
            <span data-i18n="menuLQ1">LexiQamus 1.0</span>
            <span class="side-year">2016</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
        </li>

        <li>
          <a class="side-link is-unavailable" aria-disabled="true" data-page="suggestions-history"
            >
            <i data-feather="edit-3"></i><span data-i18n="menuUpdates">History of Suggestions and Corrections</span>
            <span class="side-soon" data-i18n="soonLabel">soon</span>
          </a>
        </li>
        <li>
          <a class="side-link is-unavailable" aria-disabled="true" data-page="pricing"
            >
            <i data-feather="tag"></i><span data-i18n="menuPricing">Pricing</span>
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
`;
