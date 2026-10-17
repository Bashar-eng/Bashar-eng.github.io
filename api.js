/* ==========================================================
   Personal Portfolio - Bashar Ayman Elazony
   Design of Web-Based Systems, Assignment 3 (API integration)
   ----------------------------------------------------------
   Three public APIs, none of which need an API key:
     1. GitHub REST API   - my public repositories     (Projects)
     2. DummyJSON Quotes  - random motivational quote  (Quote of the Day)
     3. Open-Meteo        - current weather for a city (Weather)

   Every request uses fetch() with async/await and handles:
     - a loading state ("Loading...")
     - errors (network failure, bad status, timeout) with a Retry button
     - empty results

   The UI features from Assignment 2 live in script.js.
   ========================================================== */

/* ---------------------------------------------------------
   Shared helpers
   --------------------------------------------------------- */

// fetch() wrapper: parses JSON, throws on non-2xx, and gives up after
// `timeoutMs` so a slow connection can't leave "Loading..." forever.
async function fetchJson(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      const error = new Error(`Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('The request timed out. Please check your connection.');
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

// Shows one of three messages in a status element:
//   'loading' -> "Loading..." text, 'error' -> message + Retry button,
//   'empty'   -> plain note,        'clear' -> nothing.
function setStatus(element, state, message, onRetry) {
  element.className = 'api-status';
  element.replaceChildren();

  if (state === 'clear') return;

  element.classList.add(`is-${state}`);
  const text = document.createElement('span');
  text.textContent = message;
  element.appendChild(text);

  if (state === 'error' && onRetry) {
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'toggle-btn';
    retry.textContent = 'Retry';
    retry.addEventListener('click', onRetry);
    element.appendChild(retry);
  }
}

// Builds an element with optional class and text (textContent, never
// innerHTML, so data from an API can't inject markup into the page).
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ---------------------------------------------------------
   1. GitHub API - public repositories
   --------------------------------------------------------- */
(function githubRepos() {
  const USERNAME = 'Bashar-eng';
  const grid = document.getElementById('repos-grid');
  const status = document.getElementById('repos-status');
  const refreshBtn = document.getElementById('repos-refresh');
  if (!grid || !status) return;

  function renderRepo(repo) {
    const card = el('article', 'repo-card');

    const title = el('h4');
    const link = el('a', '', repo.name);
    link.href = repo.html_url;
    link.target = '_blank';
    link.rel = 'noopener';
    title.appendChild(link);

    const description = el('p', 'repo-card__desc', repo.description || 'No description provided.');

    const meta = el('ul', 'repo-card__meta');
    meta.appendChild(el('li', '', `Language: ${repo.language || 'n/a'}`));
    meta.appendChild(el('li', '', `Stars: ${repo.stargazers_count}`));
    meta.appendChild(el('li', '', `Updated: ${new Date(repo.updated_at).toLocaleDateString()}`));

    card.append(title, description, meta);
    return card;
  }

  async function loadRepos() {
    grid.replaceChildren();
    setStatus(status, 'loading', 'Loading repositories...');
    if (refreshBtn) refreshBtn.disabled = true;

    try {
      const repos = await fetchJson(
        `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`
      );

      if (!repos.length) {
        setStatus(status, 'empty', 'No public repositories found yet.');
        return;
      }

      setStatus(status, 'clear');
      repos.forEach((repo) => grid.appendChild(renderRepo(repo)));
    } catch (error) {
      // GitHub allows only 60 anonymous requests per hour per IP.
      const message =
        error.status === 403
          ? 'GitHub rate limit reached. Please try again in a few minutes.'
          : `Could not load repositories. ${error.message}`;
      setStatus(status, 'error', message, loadRepos);
    } finally {
      if (refreshBtn) refreshBtn.disabled = false;
    }
  }

  if (refreshBtn) refreshBtn.addEventListener('click', loadRepos);
  loadRepos();
})();

/* ---------------------------------------------------------
   2. Quotes API - random motivational quote
   --------------------------------------------------------- */
(function quoteOfTheDay() {
  const box = document.getElementById('quote-box');
  const text = document.getElementById('quote-text');
  const author = document.getElementById('quote-author');
  const status = document.getElementById('quote-status');
  const button = document.getElementById('quote-new');
  if (!box || !text || !author || !status || !button) return;

  async function loadQuote() {
    setStatus(status, 'loading', 'Loading quote...');
    button.disabled = true;

    try {
      const data = await fetchJson('https://dummyjson.com/quotes/random');
      text.textContent = `“${data.quote}”`;
      author.textContent = `— ${data.author}`;
      box.hidden = false;
      setStatus(status, 'clear');
    } catch (error) {
      setStatus(status, 'error', `Could not load a quote. ${error.message}`, loadQuote);
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener('click', loadQuote);
  loadQuote();
})();

/* ---------------------------------------------------------
   3. Open-Meteo API - current weather for a city
   --------------------------------------------------------- */
(function weather() {
  const form = document.getElementById('weather-form');
  const input = document.getElementById('weather-city');
  const status = document.getElementById('weather-status');
  const box = document.getElementById('weather-box');
  const iconEl = document.getElementById('weather-icon');
  const tempEl = document.getElementById('weather-temp');
  const conditionEl = document.getElementById('weather-condition');
  const metaEl = document.getElementById('weather-meta');
  if (!form || !input || !status || !box) return;

  // WMO weather codes returned by Open-Meteo -> label + icon.
  function describe(code, isDay) {
    if (code === 0) return { label: 'Clear sky', icon: isDay ? '☀️' : '🌙' };
    if (code === 1) return { label: 'Mainly clear', icon: isDay ? '🌤️' : '🌙' };
    if (code === 2) return { label: 'Partly cloudy', icon: '⛅' };
    if (code === 3) return { label: 'Overcast', icon: '☁️' };
    if (code === 45 || code === 48) return { label: 'Fog', icon: '🌫️' };
    if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: '🌦️' };
    if (code >= 61 && code <= 67) return { label: 'Rain', icon: '🌧️' };
    if (code >= 71 && code <= 77) return { label: 'Snow', icon: '❄️' };
    if (code >= 80 && code <= 82) return { label: 'Rain showers', icon: '🌦️' };
    if (code === 85 || code === 86) return { label: 'Snow showers', icon: '🌨️' };
    if (code >= 95) return { label: 'Thunderstorm', icon: '⛈️' };
    return { label: 'Unknown conditions', icon: '🌡️' };
  }

  // Step 1: turn a city name into coordinates. Step 2: ask for the weather there.
  async function loadWeather(city) {
    setStatus(status, 'loading', `Loading weather for ${city}...`);
    box.hidden = true;

    try {
      const geo = await fetchJson(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
      );
      if (!geo.results || !geo.results.length) {
        setStatus(status, 'empty', `No city found for "${city}". Try another spelling.`);
        return;
      }

      const place = geo.results[0];
      const data = await fetchJson(
        'https://api.open-meteo.com/v1/forecast' +
          `?latitude=${place.latitude}&longitude=${place.longitude}` +
          '&current=temperature_2m,weather_code,wind_speed_10m,is_day&timezone=auto'
      );

      const current = data.current;
      const { label, icon } = describe(current.weather_code, current.is_day === 1);

      iconEl.textContent = icon;
      tempEl.textContent = `${Math.round(current.temperature_2m)}°C`;
      conditionEl.textContent = label;
      metaEl.textContent =
        `${place.name}${place.country ? ', ' + place.country : ''} · ` +
        `Wind ${Math.round(current.wind_speed_10m)} km/h`;

      box.hidden = false;
      setStatus(status, 'clear');
    } catch (error) {
      setStatus(status, 'error', `Could not load the weather. ${error.message}`, () => loadWeather(city));
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const city = input.value.trim();
    if (!city) {
      setStatus(status, 'error', 'Type a city name first.');
      input.focus();
      return;
    }
    loadWeather(city);
  });

  loadWeather('Cairo');
})();
