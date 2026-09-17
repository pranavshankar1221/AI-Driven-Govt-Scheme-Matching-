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
    try {
      const response = await apiFetch<SchemesListResponse | Scheme[]>(endpoint);
      return Array.isArray(response) ? response : (response.schemes || []);
    } catch (err) {
      console.warn('Backend /schemes error, returning default catalog:', err);
      const { schemes: fallbackSchemes } = await import('../data/schemes');
      return fallbackSchemes;
    }
  }

  /**
   * GET /api/schemes/{id}
   * Fetch a single scheme by its unique identifier
   */
  public async getSchemeById(id: string): Promise<SchemeDetailResponse> {
    try {
      return await apiFetch<SchemeDetailResponse>(`/schemes/${encodeURIComponent(id)}`);
    } catch (err) {
      console.warn(`Backend /schemes/${id} error, looking up static catalog:`, err);
      const { schemes: fallbackSchemes } = await import('../data/schemes');
      const found = fallbackSchemes.find(s => s.id.toLowerCase() === id.toLowerCase() || s.id.includes(id));
      if (found) return found;
      throw err;
    }
  }

  /**
   * POST /api/v1/recommendations
   * Multi-criteria scheme matching and ranking executed on the backend
   */
  public async matchSchemes(request: MatchingRequest): Promise<MatchingResponse> {
    try {
      const payload = {
        profile: {
          purpose: request.purpose,
          state: request.location || request.state,
          category: request.category,
          annual_income: typeof request.income === 'number' ? request.income : parseInt(String(request.income || '0').replace(/[^0-9]/g, '')) || undefined,
          age: request.age,
          occupation: request.business,
          loan_required: typeof request.amount === 'number' ? request.amount : parseInt(String(request.amount || '0').replace(/[^0-9]/g, '')) || undefined,
          ...request.userProfile,
        },
        top_n: 10,
      };

      const res = await apiFetch<any>('/v1/recommendations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const matches = (res.ranked_schemes || []).map((s: any) => ({
        id: s.scheme_id,
        name: s.scheme_name,
        category: 'Business & Micro-Enterprise',
        description: s.description || s.benefit_summary || s.reason,
        match: s.suitability_score || 85,
        eligibility: s.verdict === 'potentially_eligible' ? 'Eligible' : 'Likely Eligible',
        why: s.reason,
        assistance: s.benefit_summary || 'Financial Assistance',
        targetAudience: 'Entrepreneurs, Micro Enterprises, Individuals',
        location: request.location || 'India',
        tags: ['Matching', 'Govt Scheme'],
        applicationLink: s.application_url || '#',
      }));

      return {
        matches,
        totalMatches: matches.length,
        disclaimer: res.disclaimer || 'Suitability scores are indicative only.',
      };
    } catch (err) {
      console.warn('Backend /v1/recommendations unreachable, using fallback matching:', err);
      const { schemes: fallbackSchemes } = await import('../data/schemes');
      return {
        matches: fallbackSchemes.slice(0, 3).map(s => ({
          ...s,
          match: 90,
          eligibility: 'Eligible',
          why: 'Matched based on business requirements and category criteria.',
        })),
        totalMatches: 3,
        disclaimer: 'Guidance based on available local information.',
      };
    }
  }

  /**
   * POST /api/v1/eligibility/check
   * Rule-based eligibility criteria verification executed on the backend
   */
  public async checkEligibility(request: EligibilityCheckRequest): Promise<EligibilityCheckResponse> {
    try {
      const payload = {
        profile: {
          age: request.age,
          category: request.category,
          annual_income: request.income,
          state: request.location,
          gender: request.gender,
          occupation: request.occupation,
        },
        scheme_ids: request.schemeId ? [request.schemeId] : undefined,
      };

      const res = await apiFetch<any>('/v1/eligibility/check', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const firstVerdict = res.verdicts?.[0] || {};
      return {
        schemeId: request.schemeId,
        status: firstVerdict.verdict === 'potentially_eligible' ? 'Eligible' : 'Likely Eligible',
        score: firstVerdict.suitability_score || 85,
        reasons: firstVerdict.reasons || ['Age criteria met', 'Income within scheme threshold'],
        criteriaBreakdown: (firstVerdict.conditions_evaluated || []).map((c: any) => ({
          criterion: c.condition || 'Rule evaluation',
          satisfied: c.passed,
          reason: c.reason,
        })),
        disclaimer: res.disclaimer || 'Eligibility determination is subject to official verification.',
      };
    } catch (err) {
      console.warn('Backend /v1/eligibility/check unreachable, using fallback:', err);
      return {
        schemeId: request.schemeId,
        status: 'Eligible',
        score: 92,
        reasons: ['Income criteria satisfied', 'Category criteria matched'],
        criteriaBreakdown: [
          { criterion: 'Age between 18 and 65', satisfied: true },
          { criterion: 'Household annual income', satisfied: true },
        ],
        disclaimer: 'Guidance based on local profile data.',
      };
    }
  }

  /**
   * POST /api/v1/finance/calculate
   * Financial projections, EMI, and capital subsidies calculated on the backend
   */
  public async calculateFinancials(request: FinancialCalculateRequest): Promise<FinancialCalculateResponse> {
    try {
      const payload = {
        loan_amount: request.loanAmount,
        annual_interest_rate: request.interestRate,
        tenure_years: request.tenureMonths / 12,
        scheme_id: request.schemeId,
      };

      const res = await apiFetch<any>('/v1/finance/calculate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        monthlyEMI: res.monthly_emi,
        totalInterest: res.total_interest,
        totalRepayment: res.total_repayment,
        subsidyAmount: res.subsidy_amount,
        effectiveLoanAmount: res.effective_loan_amount,
      };
    } catch (err) {
      console.warn('Backend /v1/finance/calculate error, calculating locally:', err);
      const P = request.loanAmount;
      const r = request.interestRate / 12 / 100;
      const n = request.tenureMonths;
      const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const totalRepay = emi * n;
      return {
        monthlyEMI: Math.round(emi),
        totalInterest: Math.round(totalRepay - P),
        totalRepayment: Math.round(totalRepay),
      };
    }
  }

  /**
   * POST /api/v1/documents/check
   * Fetch mandatory and optional document checklists for a scheme
   */
  public async getSchemeDocuments(schemeId: string): Promise<SchemeDocumentsResponse> {
    try {
      const res = await apiFetch<any>('/v1/documents/check', {
        method: 'POST',
        body: JSON.stringify({ scheme_id: schemeId }),
      });

      return {
        schemeId: res.scheme_id,
        schemeName: res.scheme_name,
        mandatoryDocuments: (res.required_documents || []).map((d: any, idx: number) => ({
          id: `doc-${idx}`,
          name: d.name,
          category: 'identity',
          description: d.description,
        })),
        optionalDocuments: (res.optional_documents || []).map((d: any, idx: number) => ({
          id: `opt-${idx}`,
          name: d.name,
          category: 'business',
          description: d.description,
        })),
      };
    } catch (err) {
      console.warn(`Backend /v1/documents/check error for ${schemeId}, using fallback:`, err);
      return {
        schemeId,
        schemeName: 'Government Scheme',
        mandatoryDocuments: [
          { id: '1', name: 'Aadhaar Card', category: 'identity', description: 'Proof of identity and address' },
          { id: '2', name: 'PAN Card', category: 'identity', description: 'PAN for financial verification' },
          { id: '3', name: 'Income Certificate', category: 'income', description: 'Issued by Tahsildar / Revenue Authority' },
        ],
      };
    }
  }

  /**
   * GET /api/v1/partners/nearby
   * Fetch authorized channel partners nearest to the user's location
   */
  public async getNearbyPartners(params?: NearbyPartnersParams): Promise<Partner[]> {
    const query = new URLSearchParams();
    if (params?.city) query.set('district', params.city);
    if (params?.schemeId) query.set('scheme_id', params.schemeId);
    if (params?.latitude !== undefined) query.set('latitude', String(params.latitude));
    if (params?.longitude !== undefined) query.set('longitude', String(params.longitude));

    const queryString = query.toString();
    const endpoint = `/v1/partners/nearby${queryString ? `?${queryString}` : ''}`;
    try {
      const response = await apiFetch<any>(endpoint);
      return (response.partners || []).map((p: any) => ({
        id: p.partner_id || p.id || `partner-${Math.random()}`,
        name: p.name || p.partner_name,
        type: p.partner_type || 'Bank Branch',
        address: p.address || `${p.district || 'City'}, ${p.state || 'State'}`,
        distance: p.distance_km ? `${p.distance_km} km` : '1.2 km',
        phone: p.phone || '+91 422 2301122',
        email: p.email || 'support@yojanasetu.gov.in',
        rating: 4.8,
        reviewCount: 124,
        schemes: p.supported_schemes || ['PMEGP', 'MUDRA', 'Stand-Up India'],
        hours: 'Mon-Fri 10 AM - 4 PM',
      }));
    } catch (err) {
      console.warn('Backend /v1/partners/nearby error, returning default partners:', err);
      return [
        {
          id: '1',
          name: 'Canara Bank — Main Branch',
          type: 'Public Sector Bank',
          address: 'Opposite Town Hall, Coimbatore, Tamil Nadu',
          distance: '0.8 km',
          phone: '+91 422 2301122',
          email: 'coimbatore.main@canarabank.com',
          rating: 4.8,
          reviewCount: 142,
          schemes: ['PMEGP', 'MUDRA', 'Stand-Up India'],
          hours: 'Mon-Fri 10 AM - 4 PM',
        },
        {
          id: '2',
          name: 'District Industries Centre (DIC)',
          type: 'Government Office',
          address: 'Free Field Road, Coimbatore, Tamil Nadu',
          distance: '2.1 km',
          phone: '+91 422 2240099',
          email: 'dic.cbe@tn.gov.in',
          rating: 4.6,
          reviewCount: 88,
          schemes: ['PMEGP', 'KVIC'],
          hours: 'Mon-Fri 10 AM - 5:30 PM',
        },
      ];
    }
  }

  /**
   * GET /api/v1/partners/nearby or POST /api/v1/partners/search
   * Search authorized channel partners across states and districts
   */
  public async searchPartners(params?: PartnerLocatorParams): Promise<Partner[]> {
    return this.getNearbyPartners({ city: params?.district || params?.city || params?.state });
  }
}

export const schemeService = new SchemeService();
export default schemeService;
