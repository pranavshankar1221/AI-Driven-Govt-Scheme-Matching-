import { apiFetch } from './api';
import type {
  SchemesListParams,
  SchemesListResponse,
  SchemeDetailResponse,
  MatchingRequest,
  MatchingResponse,
  EligibilityCheckRequest,
  EligibilityCheckResponse,
  FinancialCalculateRequest,
  FinancialCalculateResponse,
  SchemeDocumentsResponse,
  NearbyPartnersParams,
  NearbyPartnersResponse,
  PartnerLocatorParams,
  PartnerLocatorResponse,
} from '../types/api';
import type { Scheme, Partner } from '../types';

/**
 * Service handling all scheme, eligibility, calculation, document, and partner endpoints.
 * All ranking, calculation, and eligibility logic is delegated strictly to the backend.
 */
class SchemeService {
  /**
   * GET /api/schemes
   * Fetch all schemes with optional filtering
   */
  public async getSchemes(params?: SchemesListParams): Promise<Scheme[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.type) query.set('type', params.type);
    if (params?.search) query.set('search', params.search);
    if (params?.state) query.set('state', params.state);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const queryString = query.toString();
    const endpoint = `/schemes${queryString ? `?${queryString}` : ''}`;
    const response = await apiFetch<SchemesListResponse | Scheme[]>(endpoint);
    return Array.isArray(response) ? response : response.schemes;
  }

  /**
   * GET /api/schemes/{id}
   * Fetch a single scheme by its unique identifier
   */
  public async getSchemeById(id: string): Promise<SchemeDetailResponse> {
    return apiFetch<SchemeDetailResponse>(`/schemes/${encodeURIComponent(id)}`);
  }

  /**
   * POST /api/matching
   * Multi-criteria scheme matching and ranking executed on the backend
   */
  public async matchSchemes(request: MatchingRequest): Promise<MatchingResponse> {
    return apiFetch<MatchingResponse>('/matching', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * POST /api/eligibility/check
   * Rule-based eligibility criteria verification executed on the backend
   */
  public async checkEligibility(request: EligibilityCheckRequest): Promise<EligibilityCheckResponse> {
    return apiFetch<EligibilityCheckResponse>('/eligibility/check', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * POST /api/financial/calculate
   * Financial projections, EMI, and capital subsidies calculated on the backend
   */
  public async calculateFinancials(request: FinancialCalculateRequest): Promise<FinancialCalculateResponse> {
    return apiFetch<FinancialCalculateResponse>('/financial/calculate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * GET /api/schemes/{id}/documents
   * Fetch mandatory and optional document checklists for a scheme
   */
  public async getSchemeDocuments(schemeId: string): Promise<SchemeDocumentsResponse> {
    return apiFetch<SchemeDocumentsResponse>(`/schemes/${encodeURIComponent(schemeId)}/documents`);
  }

  /**
   * GET /api/partners/nearby
   * Fetch authorized channel partners nearest to the user's location
   */
  public async getNearbyPartners(params?: NearbyPartnersParams): Promise<Partner[]> {
    const query = new URLSearchParams();
    if (params?.city) query.set('city', params.city);
    if (params?.schemeId) query.set('schemeId', params.schemeId);
    if (params?.radiusKm) query.set('radiusKm', String(params.radiusKm));
    if (params?.latitude !== undefined) query.set('latitude', String(params.latitude));
    if (params?.longitude !== undefined) query.set('longitude', String(params.longitude));

    const queryString = query.toString();
    const endpoint = `/partners/nearby${queryString ? `?${queryString}` : ''}`;
    const response = await apiFetch<NearbyPartnersResponse | Partner[]>(endpoint);
    return Array.isArray(response) ? response : response.partners;
  }

  /**
   * GET /api/partners/locator
   * Search authorized channel partners across states and districts
   */
  public async searchPartners(params?: PartnerLocatorParams): Promise<Partner[]> {
    const query = new URLSearchParams();
    if (params?.state) query.set('state', params.state);
    if (params?.district) query.set('district', params.district);
    if (params?.city) query.set('city', params.city);
    if (params?.schemeType) query.set('schemeType', params.schemeType);
    if (params?.search) query.set('search', params.search);

    const queryString = query.toString();
    const endpoint = `/partners/locator${queryString ? `?${queryString}` : ''}`;
    const response = await apiFetch<PartnerLocatorResponse | Partner[]>(endpoint);
    return Array.isArray(response) ? response : response.partners;
  }
}

export const schemeService = new SchemeService();
export default schemeService;
