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
window.LQ_BUILT_PAGES = ["about", "institutional", "what-is-lexiqamus", "team", "pricing", "lq1", "suggestions-history", "user-guide", "lq3-whats-new", "lq2-whats-new", "data-model", "lexicon-digitization"];

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

  <!-- The account window. Empty until one of the buttons above is pressed;
       its markup is in the template below. -->
  <div class="modal fade auth-modal" id="authModal" tabindex="-1" aria-hidden="true"></div>

  <template id="authTemplate">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <ul class="nav nav-tabs auth-tabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="signInTab" data-bs-toggle="tab" data-bs-target="#signInPane"
                      type="button" role="tab" aria-controls="signInPane" aria-selected="false"
                      data-i18n="menuSignIn">Sign in</button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="signUpTab" data-bs-toggle="tab" data-bs-target="#signUpPane"
                      type="button" role="tab" aria-controls="signUpPane" aria-selected="false"
                      data-i18n="menuSignUp">Sign up</button>
            </li>
          </ul>
          <button type="button" class="btn-close" data-bs-dismiss="modal"
                  aria-label="Close" data-i18n-aria="close"></button>
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
              <div class="auth-row">
                <div class="auth-field">
                  <label for="signUpFirst" data-i18n="authFirstName">First name</label>
                  <input type="text" id="signUpFirst" class="form-control" autocomplete="given-name" required>
                </div>
                <div class="auth-field">
                  <label for="signUpLast" data-i18n="authLastName">Last name</label>
                  <input type="text" id="signUpLast" class="form-control" autocomplete="family-name" required>
                </div>
              </div>
              <div class="auth-field">
                <label for="signUpEmail" data-i18n="authEmail">Email</label>
                <input type="email" id="signUpEmail" class="form-control" autocomplete="email" required>
              </div>
              <div class="auth-field">
                <label for="signUpPassword" data-i18n="authPassword">Password</label>
                <input type="password" id="signUpPassword" class="form-control"
                       autocomplete="new-password" aria-describedby="signUpPasswordHint" required>
                <p class="auth-hint" id="signUpPasswordHint" data-i18n="authPasswordHint">At least 8 characters, letters and numbers, with one capital letter.</p>
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
                <i data-feather="check-circle" aria-hidden="true"></i>
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
