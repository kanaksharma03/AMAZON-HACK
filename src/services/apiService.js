import {
  STUDY_REGIONS,
  INITIAL_SITES,
  INTERVENTION_CATALOG,
  DATASET_REGISTRY,
  METHODOLOGY_DOCUMENTATION,
} from '../data/demoDataset';

export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

export async function checkApiHealth(customBaseUrl) {
  const baseUrl = (customBaseUrl || getApiBaseUrl()).replace(/\/$/, '');
  const endpoint = `${baseUrl}/health`;
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) {
      return {
        ok: false,
        status: response.status,
        latencyMs,
        endpoint,
        message: `Endpoint ${endpoint} returned HTTP ${response.status} (${contentType || 'non-JSON'}). No live backend API is currently attached.`,
      };
    }

    const data = await response.json();
    return {
      ok: true,
      status: response.status,
      latencyMs,
      endpoint,
      message: data.message || 'Connected to live BHUJAL backend service.',
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      ok: false,
      status: 0,
      latencyMs,
      endpoint,
      message:
        err.name === 'AbortError'
          ? `Connection to ${endpoint} timed out after 4.5s.`
          : `Unable to reach live backend at ${endpoint} (${err.message || 'Network Error'}).`,
    };
  }
}

export async function fetchPlatformDataset(dataMode = 'demo', customBaseUrl) {
  if (dataMode === 'demo') {
    return {
      source: 'demo',
      regions: STUDY_REGIONS,
      sites: INITIAL_SITES,
      interventions: INTERVENTION_CATALOG,
      datasets: DATASET_REGISTRY,
      methodology: METHODOLOGY_DOCUMENTATION,
    };
  }

  const baseUrl = (customBaseUrl || getApiBaseUrl()).replace(/\/$/, '');
  const endpoint = `${baseUrl}/v1/watershed-data`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || !contentType.includes('application/json')) {
    throw new Error(
      `Live API request to ${endpoint} failed (HTTP ${response.status}). No automatic fallback to Demo Mode was performed.`
    );
  }

  const payload = await response.json();
  return {
    source: 'live',
    ...payload,
  };
}
